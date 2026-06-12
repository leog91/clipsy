console.log("TURSO_DATABASE_URL:", process.env.TURSO_DATABASE_URL ? "FOUND" : "MISSING");
console.log("Value starts with:", process.env.TURSO_DATABASE_URL ? process.env.TURSO_DATABASE_URL.substring(0, 15) : "undefined");
