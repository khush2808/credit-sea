
const axios = require("axios");

const API_BASE_URL = "http://localhost:8000/api";


const AUTH_TOKEN = "YOUR_TOKEN_HERE"; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${AUTH_TOKEN}`,
  },
});

async function testAPI() {
  console.log("🧪 Testing API endpoints...");

  const endpoints = [
    { name: "Dashboard Stats", url: "/stats/dashboard" },
    { name: "Applications List", url: "/applications" },
    { name: "Applications (page 1)", url: "/applications?page=1&limit=10" },
    { name: "Loans List", url: "/loans" },
    { name: "Users List", url: "/admin/users" },
    { name: "Profile", url: "/auth/profile" },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔄 Testing ${endpoint.name}...`);
      const response = await api.get(endpoint.url);
      console.log(`✅ ${endpoint.name} - Status: ${response.status}`);
      console.log(`📊 Data structure:`, typeof response.data);
      console.log(`📋 Data keys:`, Object.keys(response.data || {}));

      if (response.data && response.data.data) {
        console.log(`📈 Inner data type:`, typeof response.data.data);
        console.log(
          `📈 Inner data is array:`,
          Array.isArray(response.data.data)
        );
        if (Array.isArray(response.data.data)) {
          console.log(`📈 Array length:`, response.data.data.length);
        }
      }

      console.log(
        `📝 Sample data:`,
        JSON.stringify(response.data, null, 2).substring(0, 200) + "..."
      );
    } catch (error) {
      console.error(
        `❌ ${endpoint.name} - Error:`,
        error.response?.status,
        error.response?.data?.message || error.message
      );
    }
  }
}


console.log(`
🔧 To use this script:

1. Get your auth token from browser:
   - Open DevTools (F12)
   - Go to Application tab
   - Click on Cookies
   - Copy the 'auth_token' value
   
2. Replace YOUR_TOKEN_HERE with the actual token

3. Run: node test-api.js
`);

if (AUTH_TOKEN !== "YOUR_TOKEN_HERE") {
  testAPI().catch(console.error);
} else {
  console.log("❌ Please set the AUTH_TOKEN first!");
}
