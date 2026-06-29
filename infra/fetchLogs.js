const { execSync } = require('child_process');

try {
  const logStreamOutput = execSync(`aws logs describe-log-streams --log-group-name "/ecs/odoo-cafe-backend-prod" --order-by LastEventTime --descending --limit 1 --query "logStreams[0].logStreamName" --output text`, { encoding: 'utf-8' });
  const logStream = logStreamOutput.trim();
  
  const eventsOutput = execSync(`aws logs get-log-events --log-group-name "/ecs/odoo-cafe-backend-prod" --log-stream-name "${logStream}" --limit 50 --query "events[*].message" --output json`, { encoding: 'utf-8' });
  const events = JSON.parse(eventsOutput);
  
  const fs = require('fs');
  fs.writeFileSync('ecsLogs.json', JSON.stringify(events, null, 2));
  console.log("Logs written to ecsLogs.json");
} catch (err) {
  console.error("Failed:", err.message);
}
