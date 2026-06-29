const { CloudWatchLogsClient, GetLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

const client = new CloudWatchLogsClient({ region: 'us-east-1' });

async function fetchLogs() {
  const command = new GetLogEventsCommand({
    logGroupName: '/ecs/odoo-cafe-backend-prod',
    logStreamName: 'backend/backend/c540ba75937e41ffa3694b37dd7bb9cb',
  });
  
  try {
    const response = await client.send(command);
    for (const event of response.events) {
      console.log(event.message);
    }
  } catch (err) {
    console.error(err);
  }
}

fetchLogs();
