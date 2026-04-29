// URL Secrets **DO NOT COMMIT**
const ciWebhookURL = "";
const roWebhookURL = "";
const forwardURL = "";

// Sheet Configs
const eventStartCell = { sheet: "Settings", address: "F4" };
const eventEndCell = { sheet: "Settings", address: "F5" };
const ciCell = { sheet: "Schedule", address: "S6" };
const roCell = { sheet: "Schedule", address: "T6" };
const nextHourTeamRange = { sheet: "Schedule", address: "M6:Q6" }
const nextHourCell = { sheet: "Schedule", address: "B6" }

/* 
Automated notifications addon for @infinite_penguin's PRSK tiering shedule.
Original sheet here: https://docs.google.com/document/d/1t5OQ3joyqRTCu0n0sQ7jpcsKnvU8ws7wm2ERJ2lB0bw/edit

Created by Yhsanave. Feel free to message me on Discord if you have any questions.

See the README in the GitHub repo (https://github.com/yhsanave/penguin-schedule-notifier) for instructions to set up the forwarding service.

Script Setup:
In your copy of the spreadsheet: Extensions > Apps Script.
Add a script file, then copy and paste this entire script into it.
Create a webhook (Server Settings > Integrations > Webhooks) for the channels you want to send messages in and put them in the variables above (in the quotes). 
If you want to send the messages to the same channel, you can just put the same webhook link in both.
Check that the Sheet Configs above are correct, in case the template has been updated.
Add a time-driven trigger that runs the notify function every 10 minutes.

**IMPORTANT**
Anyone with access to the spreadsheet can view this code, including your webhook and forwarding URLs.
These are sensitive and could allow anyone to send messages to the channels.
DO NOT SHARE this sheet or script publicly, or with anyone you don't trust, once you have added the URLs.
If your webhook URLs get leaked, delete them and make new ones.
*/

function notify() {
  // Don't send messages before event start and delete trigger after event end.
  const eventStartTimestamp = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(eventStartCell.sheet).getRange(eventStartCell.address).getValue();
  const eventEndTimestamp = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(eventEndCell.sheet).getRange(eventEndCell.address).getValue();
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
  if (currTime.getMinutes() < 40 || currTime.getMinutes() >= 50) {
    Logger.log('Not time to send yet. Skipping.');
    return;
  }

  // Check in message
  const ciMessage = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ciCell.sheet).getRange(ciCell.address).getValue();
  if (ciMessage == "" || ciMessage == "^") {
    Logger.log("No check-in needed. Skipping.");
  } else {
    const ciContent = {
      'content': ciMessage
    };
    sendMessage(ciContent, ciWebhookURL);
  }

  // Room order message
  const roMessage = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(roCell.sheet).getRange(roCell.address).getValue();
  if (roMessage == "") {
    Logger.log("No room order message needed. Skipping.");
  } else {
    const roContent = {
      'content': roMessage.toString().endsWith("needs teams") ? getNextHourSlotsMessage() : roMessage
    };
    sendMessage(roContent, roWebhookURL);
  }
}

// Handling for unfilled hours
function getNextHourSlotsMessage() {
  const fillers = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nextHourTeamRange.sheet).getRange(nextHourTeamRange.address).getValues()[0];
  const nextHour = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nextHourCell.sheet).getRange(nextHourCell.address).getValue();
  const emptySlots = fillers.filter(f => f == "").length;
  return `Room is **+${emptySlots}** next hour (${nextHour})\n**Currently signed up:** ${fillers.filter(f => f != "").join(", ")}`;
}

// Send the message to the forwarding service, which forwards it to the provided webhook
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