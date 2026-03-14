import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ses = new SESClient({ 
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const cmd = new SendEmailCommand({
  Source: "offers@dokit.ai",
  Destination: { ToAddresses: ["cguiher17@gmail.com"] },
  Message: {
    Subject: { Data: "🎉 Sirkl Platform Test - SES Working!" },
    Body: { 
      Text: { Data: "If you receive this, SES is configured correctly. Ready for E2E testing!" },
      Html: { Data: "<h2>✅ Sirkl Platform - SES Test Successful</h2><p>If you see this email, AWS SES is working correctly with the dokit.ai domain.</p><p><strong>Next step:</strong> Full E2E bill negotiation test!</p>" }
    }
  }
});

try {
  const result = await ses.send(cmd);
  console.log("✅ Email sent! MessageId:", result.MessageId);
} catch(e) {
  console.error("❌ Error:", e.message);
}
