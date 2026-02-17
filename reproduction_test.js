const app = require('./index.js');

// Simple test to demonstrate the bug
console.log("=== Bug Reproduction Test ===\n");

// Simulate a request by directly calling the route logic
const users = [];
const mockReq = { body: { name: "Test User", email: "test@example.com" } };
const mockRes = { 
  json: (data) => {
    console.log("Created user:", data);
    users.push(data);
    
    // Now test the problematic GET route
    console.log("\n1. Testing GET /users/1 (normal):");
    const getUser1 = users.find(u => u.id === "1");  // simulating req.params.id as string
    console.log("   Result:", getUser1);  // undefined because 1 !== "1"
    
    console.log("\n2. Testing GET /users/01 (with leading zero):");
    const getUser01 = users.find(u => u.id === "01");  // simulating req.params.id as string  
    console.log("   Result:", getUser01);  // undefined because 1 !== "01"
    
    console.log("\n3. What should work (converting to number):");
    const getUserFixed = users.find(u => u.id === parseInt("01", 10));
    console.log("   Result:", getUserFixed);  // should find the user
    
    console.log("\n=== Analysis ===");
    console.log("Problem: req.params.id is a string, but user.id is a number");
    console.log("Impact: ALL user lookups by ID fail, not just leading zeros");
    console.log("Root cause: Type mismatch in comparison (string vs number)");
  }
};

// Simulate creating a user
console.log("Creating a user...");
const user = { id: users.length + 1, name: mockReq.body.name, email: mockReq.body.email };
mockRes.json(user);
