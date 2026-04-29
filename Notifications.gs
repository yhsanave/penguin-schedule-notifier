// URL Secrets **DO NOT COMMIT**
const ciWebhookURL = "";
const roWebhookURL = "";
const forwardURL = "";

// Sheet Configs
const eventStartCell = { sheet: "Settings", cell: "F4" };
const eventEndCell = { sheet: "Settings", cell: "F5" };
const ciCell = { sheet: "Schedule", cell: "S6"};
const roCell = { sheet: "Schedule", cell: "T6"};

/* 
Automated notifications addon for @infinite_penguin's PRSK tiering shedule.
Original sheet here: https://docs.google.com/document/d/1t5OQ3joyqRTCu0n0sQ7jpcsKnvU8ws7wm2ERJ2lB0bw/edit

Created by Yhsanave. Feel free to message me on Discord if you have any questions.

Because of Discord's global rate limit, webhook requests from app scripts often get rate limited.
To fix this, I created a basic API that just forwards the request to bypass the rate limit.
Get this from my github and deploy it to some server, then put the URL for that server in the forwardURL variable.
I used [leapcell](https://leapcell.io) when I did it because it was the first search result.
Their free tier should be plenty (no payment info needed).
Sorry, there really isn't a better way :(.

Setup:
In your copy of the spreadsheet: Extensions > Apps Script.
Add a script file, then copy and paste this entire script into it.
Create a webhook for the channels you want to send messages in and put them in the variables above (in the quotes). 
If you want to send the messages to the same channel, you can just put the same webhook link in both.
Check that the Sheet Configs above are correct, in case the template has been updated.
Add a time-driven trigger that runs the notify function every 10 minutes.

**IMPORTANT**
Anyone with access to the spreadsheet can view this code, including your webhook and forwarding URLs.
These are sensitive and could allow anyone to send messages to the channels.
DO NOT SHARE this sheet or script publicly, or with anyone you don't trust, once you have added the URLs.
*/

function notify() {
  // Don't send messages before event start and delete trigger after event end.
  const eventStartTimestamp = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(eventStartCell.sheet).getRange(eventStartCell.cell).getValue();
  const eventEndTimestamp = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(eventEndCell.sheet).getRange(eventEndCell.cell).getValue();
  if (Date.now() / 1000 < eventStartTimestamp - 3600) { return; }
  if (Date.now() / 1000 > eventEndTimestamp) {
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
      if (t.getHandlerFunction() == 'notify') { ScriptApp.deleteTrigger(t) }
      Logger.log("Event over, deleting notify trigger.");
    })
    return;
  }

  // Only send between :40 and :50
  const currTime = new Date();
  if (currTime.getMinutes() < 40 || currTime.getMinutes >= 50) {
    Logger.log('Not time to send yet. Skipping.');
    return;
  }

  // Check in message
  var ciMessage = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ciCell.sheet).getRange(ciCell.cell).getValue();
  if (ciMessage != "") {
    var ciContent = {
      'content': ciMessage,
      'embeds': [],
      'attachments': []
    };
    sendMessage(ciContent, ciWebhookURL);
  } else {
    Logger.log("No check-in needed. Skipping.");
  }

  // Room order message
  var roMessage = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(roCell.sheet).getRange(roCell.cell).getValue();
  if (roMessage != "") {
    var roContent = {
      'content': roMessage,
      'embeds': [],
      'attachments': []
    };
    sendMessage(roContent, roWebhookURL);
  } else {
    Logger.log("No room order message needed. Skipping.");
  }
}

function sendMessage(content, webhookURL) {
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify({
      'content': JSON.stringify(content),
      'webhookURL': webhookURL
    })
  };
  Logger.log(options.payload);
  UrlFetchApp.fetch(forwardURL, options);
}