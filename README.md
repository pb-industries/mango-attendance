# BNC Attendance

This CLI application acts as an interface for recording raid attendance of members in BNC. The application runs on NodeJS and connects to a Postgresql database to store meta information on raids. Data can then be persisted to a Google Sheet.

## Pre-requisites

### Installing dependencies...

Before you can start recording attendance you will need to ensure that you have NodeJS installed on your machine. The app has been built and tested with node 14.18.0. The [latest installation client](https://nodejs.dev/download) for your system should suffice.

_NOTE_ Please ensure that when running the application in Windows, you are not running it from WSL, as WSL cannot tail files written to by the host machine which means we cannot read log files in real time.

### Getting the source files...

If you have git installed, clone this repository on your machine with `git clone git@github.com:alexmk92/bnc-attendance` _ALTERNATIVELY_ if you don't have git installed you can [download the repo directly](https://github.com/alexmk92/bnc-attendance/archive/refs/heads/master.zip) from github

Once you have the files downloaded, open a new PowerShell (or whatever terminal you feel comfortable with) and run `cd path/to/bnc-attendance`

Now run `npm install` to fetch all peer dependencies of the project, followed `npm install -g .` to install the `bnc-attendance` CLI tool (this will allow you to run commands later with the `bnc-attendance` prefix)

### Provisioning configuration files...

#### Environemnt vars

Because this application talks to a postgres database and a Google sheet, we need to add a couple of files to the project. Firstly, run `cp .env.example .env` to clone the required environment variables to a new file, then ask Karadin for the DB configuration variables (we don't commit these to source control otherwise any Tom, Dick or Harry could flood our DB with unwanted traffic!)

Now create an empty `secrets.json` file at the root of the project with `touch secrets.json`

#### Pick the correct log file

Change the `LOG_FILE_PATH` to be wherever your log file is, for me its at `"/Users/Public/Daybreak Game Company/Installed Games/Everquest/Logs/eqlog_Karadin_mischief.txt"`

#### Google sheet access

If we wish to continue using Karadin's attendance Google sheet, then ask Karadin for the contents of his `secrets.json`, alternatively you will need to generate keypair yourself.

#### Generating a keypair (if you don't go with previous step)

- Ensure you are logged into the Google account that owns the Google sheet you're about to grant read/write access to.
- Go to the [Google Cloud console](https://console.cloud.google.com/)
- In the navigation bar, there should be a `select project` dropdown, click this and when the modal opens up click `new project` in the upper right
- Give the project a name (maybe BNC Attendance, but it can be whatever) then click create
- In the search bar at the top, type `Sheets` and select `Google Sheets API`
- After being redirected, click `Enable`, you should be redirected again to an `Overview` page
- Click `Credentials` in the left hand menu and then click `Create credentials` at the top, selecting `Service account` as the option
- Give the service account a name (bnc-attendance-app will do)...click `create and continue` and then click `done` (you don't need to grant roles)
- You should now be back on the `credentials` tab, from here click on the service account you just created
- You'll now be on a service account page, click `keys` from the top menu and then click `add key` and then `create new key` selecting `json` as the option...this will then download the access key to your system.
- Copy and paste the contents of this access key to the `secrets.json` file you create in the previous `Google sheets access` step.
- Open your Google Sheet and create a sheet called `Attendance` then in the URL of the spreadsheet copy the long spreadsheet ID (we will be pasting this into the `.env` file under the `GOOGLE_SHEET_ID` field)
- You should now be good to go, good stuff!

### Running the app!

If all has gone well, you should now be able to run `bnc-attendance` which should provide you with a list of command to run.

#### Members

The parser will only record attendance for raid members that currently belong to our roster; I have currently added all main characters only (as we don't want to track box attendance too).

In order to add a new member to our roster we can run `bnc-attendance roster-add PLAYER_1,PLAYER_2` this command can take a comma separated list to add multiple player at once.

We can also remove players with `bnc-attendance roster-remove PLAYER_1,PLAYER_2`

#### Recording raid attendance

When recording attendance over the night I tend to run `bnc-attendance record "Tunare + AoW + Yelinak"`, substituting the name of the raid for whatever we're doing that night...if we run this command again with a different name it will rename the raid providing it is still the same day.

This command will tail the log file and respond to a `/who all guild`; I will periodically run this a few times an hour, raid attendance is the submitted to the database on the fly. (I used to match attendance by zone, but as a lot of member have `/role` on, they appear as `ANONYMOUS`, we therefore now grant attendance to all mains who are presently online. Manual adjustments can be made in the DB after if needs be)

#### Pushing attendance to the sheet

At the end of the night, we can aggregate all raid attendance to the google sheet by running `bnc-attendance sync`, this will sum the last `30, 60, 90` days attendance for all players and update the sheet accordingly, this command is not time sensitive and purely exists to output current attendance data to Google.
