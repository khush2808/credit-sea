import { Request, Response } from 'express';
import { Application, User, Loan } from '../models';
import { 
  sendSuccess, 
  sendError, 
  sendNotFound,
  sendForbidden,
  sendPaginatedResponse 
} from '../utils/response';
import { ApplicationStatus, UserRole, EmploymentStatus } from '../types';
import { logger } from '../utils/logger';


export const createApplication = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { amount, tenure, empStatus, reason, empAddress } = req.body;

    
    const existingApplication = await Application.findOne({
      userId,
      status: { $in: [ApplicationStatus.PENDING, ApplicationStatus.VERIFIED] }
    });

    if (existingApplication) {
      return sendError(res, 'You already have a pending application. Please wait for it to be processed.', 400);
    }

    
    const activeLoan = await Loan.findOne({ userId, isPaid: false });
    if (activeLoan) {
      return sendError(res, 'You already have an active loan. Please complete it before applying for a new one.', 400);
    }

    
    const application = new Application({
      userId,
      amount,
      tenure,
      empStatus,
      reason,
      empAddress,
      status: ApplicationStatus.PENDING
    });

    await application.save();

    
    await application.populate('user', 'name email phone');

    logger.info(`New application created: ${application._id} by user ${userId}`);

    return sendSuccess(res, application, 'Application submitted successfully', 201);

  } catch (error) {
    logger.error('Create application error:', error);
    return sendError(res, 'Failed to create application');
  }
};


export const getApplications = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'dateTime', sortOrder = 'desc' } = req.query;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    let query: any = {};
    let populateFields = 'user verifier admin';

    
    switch (userRole) {
      case UserRole.USER:
        
        query.userId = userId;
        populateFields = 'verifier admin';
        break;
      
      case UserRole.VERIFIER:
        
        query = {
          $or: [
            { status: ApplicationStatus.PENDING },
            { verifierId: userId }
          ]
        };
        break;
      
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        
        break;
    }

    
    if (status) {
      query.status = status;
    }

    
    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    
    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('user', 'name email phone')
        .populate('verifier', 'name email')
        .populate('admin', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Application.countDocuments(query)
    ]);

    return sendPaginatedResponse(
      res,
      applications,
      total,
      Number(page),
      Number(limit),
      'Applications retrieved successfully'
    );

  } catch (error) {
    logger.error('Get applications error:', error);
    return sendError(res, 'Failed to retrieve applications');
  }
};


export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const application = await Application.findById(id)
      .populate('user', 'name email phone')
      .populate('verifier', 'name email')
      .populate('admin', 'name email');

    if (!application) {
      return sendNotFound(res, 'Application not found');
    }

    
    const canAccess = 
      userRole === UserRole.ADMIN || 
      userRole === UserRole.SUPER_ADMIN ||
      (userRole === UserRole.USER && application.userId.toString() === userId) ||
      (userRole === UserRole.VERIFIER && (
        application.status === ApplicationStatus.PENDING || 
        application.verifierId?.toString() === userId
      ));

    if (!canAccess) {
      return sendForbidden(res, 'Access denied');
    }

    return sendSuccess(res, application, 'Application retrieved successfully');

  } catch (error) {
    logger.error('Get application by ID error:', error);
    return sendError(res, 'Failed to retrieve application');
  }
};


export const verifyApplication = async (req: Request, res: Response) => {
  try {
    const { applicationId, status, notes, rejectionReason } = req.body;
    const verifierId = req.user!.userId;

    const application = await Application.findById(applicationId);
    if (!application) {
      return sendNotFound(res, 'Application not found');
    }

    
    if (!application.canBeVerified()) {
      return sendError(res, 'Application cannot be verified in its current state', 400);
    }

    
    application.status = status === 'VERIFIED' ? ApplicationStatus.VERIFIED : ApplicationStatus.REJECTED;
    application.verifierId = verifierId;
    application.verificationNotes = notes;
    
    if (status === 'REJECTED') {
      application.rejectionReason = rejectionReason;
    }

    await application.save();

    
    await application.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'verifier', select: 'name email' }
    ]);

    logger.info(`Application ${applicationId} ${status.toLowerCase()} by verifier ${verifierId}`);

    return sendSuccess(res, application, `Application ${status.toLowerCase()} successfully`);

  } catch (error) {
    logger.error('Verify application error:', error);
    return sendError(res, 'Failed to verify application');
  }
};


export const approveApplication = async (req: Request, res: Response) => {
  try {
    const { applicationId, status, interestRate, rejectionReason } = req.body;
    const adminId = req.user!.userId;

    const application = await Application.findById(applicationId);
    if (!application) {
      return sendNotFound(res, 'Application not found');
    }

    
    if (!application.canBeApproved()) {
      return sendError(res, 'Application must be verified before it can be approved', 400);
    }

    if (status === 'APPROVED') {
      if (!interestRate) {
        return sendError(res, 'Interest rate is required for approval', 400);
      }

      
      application.status = ApplicationStatus.APPROVED;
      application.adminId = adminId;
      await application.save();

      
      const loan = new Loan({
        applicationId: application._id,
        userId: application.userId,
        approvalDate: new Date(),
        interestRate,
        principalLeft: application.amount,
        tenureMonths: application.tenure,
        totalAmount: application.amount,
        emi: 0 
      });

      
      loan.emi = loan.calculateEMI(application.amount, interestRate, application.tenure);
      
      
      const nextPaymentDate = new Date();
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      loan.nextPaymentDate = nextPaymentDate;

      await loan.save();

      
      await application.populate([
        { path: 'user', select: 'name email phone' },
        { path: 'verifier', select: 'name email' },
        { path: 'admin', select: 'name email' }
      ]);

      logger.info(`Application ${applicationId} approved and loan ${loan._id} created by admin ${adminId}`);

      return sendSuccess(res, {
        application,
        loan
      }, 'Application approved and loan created successfully');

    } else {
      
      application.status = ApplicationStatus.REJECTED;
      application.adminId = adminId;
      application.rejectionReason = rejectionReason;
      await application.save();

      await application.populate([
        { path: 'user', select: 'name email phone' },
        { path: 'verifier', select: 'name email' },
        { path: 'admin', select: 'name email' }
      ]);

      logger.info(`Application ${applicationId} rejected by admin ${adminId}`);

      return sendSuccess(res, application, 'Application rejected successfully');
    }

  } catch (error) {
    logger.error('Approve application error:', error);
    return sendError(res, 'Failed to process application');
  }
};


export const getApplicationStats = async (req: Request, res: Response) => {
  try {
    const stats = await Application.getApplicationStats();
    
    
    const [totalApplications, recentApplications] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({
        dateTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      })
    ]);

    const response = {
      ...stats,
      totalApplications,
      recentApplications,
      updatedAt: new Date()
    };

    return sendSuccess(res, response, 'Application statistics retrieved successfully');

  } catch (error) {
    logger.error('Get application stats error:', error);
    return sendError(res, 'Failed to retrieve application statistics');
  }
};


export const getUserApplications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    
    const user = await User.findById(userId);
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [applications, total] = await Promise.all([
      Application.find({ userId })
        .populate('verifier', 'name email')
        .populate('admin', 'name email')
        .sort({ dateTime: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Application.countDocuments({ userId })
    ]);

    return sendPaginatedResponse(
      res,
      applications,
      total,
      Number(page),
      Number(limit),
      'User applications retrieved successfully'
    );

  } catch (error) {
    logger.error('Get user applications error:', error);
    return sendError(res, 'Failed to retrieve user applications');
  }
};


export const updateApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { reason, empAddress } = req.body;

    const application = await Application.findOne({ _id: id, userId });
    if (!application) {
      return sendNotFound(res, 'Application not found');
    }

    
    if (application.status !== ApplicationStatus.PENDING) {
      return sendError(res, 'Can only update pending applications', 400);
    }

    
    if (reason !== undefined) application.reason = reason;
    if (empAddress !== undefined) application.empAddress = empAddress;

    await application.save();

    logger.info(`Application ${id} updated by user ${userId}`);

    return sendSuccess(res, application, 'Application updated successfully');

  } catch (error) {
    logger.error('Update application error:', error);
    return sendError(res, 'Failed to update application');
  }
}; 