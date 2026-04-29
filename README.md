# Penguin Schedule Notifier

An addon for [@infinite_penguin's PRSK tiering schedule template](https://docs.google.com/document/d/1t5OQ3joyqRTCu0n0sQ7jpcsKnvU8ws7wm2ERJ2lB0bw/edit) that automates the sending of CI and RO messages.

## Setup

### Apps Script

- In your copy of the spreadsheet: Extensions > Apps Script.
- Add a script file, then copy and paste [Notifications.gs](./Notifications.gs) into it.
- Create a webhook (Server Settings > Integrations > Webhooks) for the channels you want to send messages in and put them in the variables at the top of the script (in the quotes).
- If you want to send the messages to the same channel, you can just put the same webhook link in both.
- Check that the Sheet Configs are correct, in case the template has been updated.
- Add a time-driven trigger that runs the notify function every 10 minutes.

### Forwarding API

Because of Discord's global rate limit, webhook requests from app scripts often get rate limited. To fix this, I created a [basic API](./forwarding-api/) that just forwards the request to bypass the rate limit. Deploy it to some server, then put the URL for that server in the forwardURL variable in [Notifications.gs](./Notifications.gs). 

There is no security on here, so like don't go telling people you have this up because they could abuse it to proxy spam through your computer, which could result in you getting IP banned. Like for real this just straight up forwards anything you send to it. Really shouldn't be done but it works.

Uses FastAPI so you can deploy it anywhere you could deploy that. See their [docs](https://fastapi.tiangolo.com/deployment/) for instructions. I used [Leapcell](https://leapcell.io) when I did it because it was the first search result. Their free tier should be plenty (no payment info needed) and it's pretty easy to set up (just fork this repo and you can deploy it directly with the config below).

### Leapcell Config

|     Setting      |                     Value                     |
| :--------------: | :-------------------------------------------: |
| Framework Preset |                    FastAPI                    |
|      Branch      |                     main                      |
|  Root Directory  |               ./forwarding-api                |
|     Runtime      |                    Python                     |
|  Build Command   |       `pip install -r requirements.txt`       |
|  Start Command   | `uvicorn main:app --host 0.0.0.0 --port 8080` |
|   Serving Port   |                     8080                      |
|  Memory and CPU  |           Minimum is fine for both            |

