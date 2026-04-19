import * as scanService from "../src/modules/scan/scan.service.js";
import * as alertService from "../src/modules/alerts/alert.service.js";
import { readData, writeData } from "../src/config/db.js";

async function testGuardianMode() {
  console.log("Starting Guardian Mode Test...");

  // 1. Clear existing data for a clean test
  writeData("scans", []);
  writeData("alerts", []);

  // 2. Perform a scan for a dependent
  console.log("Scanning scam text for dependent (user_123)...");
  const scamText = "URGENT: Your account is blocked. Click here to verify: http://scam.com";
  const scanResult = await scanService.scanText(scamText, "user_123");
  
  console.log("Scan Result Risk Level:", scanResult.risk_level);

  // 3. Check for alerts
  const guardianAlerts = alertService.getAlertsByGuardian("guardian_456");
  console.log("Alerts for guardian_456 count:", guardianAlerts.length);

  if (guardianAlerts.length > 0) {
    const alert = guardianAlerts[0];
    console.log("Alert Title:", alert.title);
    console.log("Alert Status (should be pending):", alert.status);

    // 4. Update alert status
    console.log("Updating alert status to 'blocked'...");
    const updatedAlert = alertService.updateAlertStatus(alert.id, "blocked");
    console.log("Updated Alert Status:", updatedAlert.status);
    
    if (updatedAlert.status === "blocked") {
      console.log("TEST SUCCESS: Guardian alert created and blocked successfully.");
    } else {
      console.log("TEST FAILED: Alert status not updated correctly.");
    }
  } else {
    console.log("TEST FAILED: No alert created for the guardian.");
  }
}

testGuardianMode().catch(console.error);
