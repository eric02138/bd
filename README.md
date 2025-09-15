# Testing Roombas at iRobot - Challenges and Solutions
At iRobot a lot of our Roomba reliability testing was manual.  An engineer would physically baby-sit robots through missions and would read the resulting data directly from the robots when they were done.  Given that the robots constantly "talked" to the cloud (at least in production), there seemed room to automate the process with the ultimate goal of moving the testing offshore, either to Mexico or China.

What we envisioned was a testing facility where many robots running on testbeds could be monitored by a technician at a workstation using a web interface.  Using the web interface, the technician could easily see when robots were stuck, out of batteries or broken and move to address the problem.  Additionally, we set up our own testing cloud to capture all of the events the robots were reporting in order to derive metrics like mean-time-to-failure, mean-battery-life, etc.

![Workstation](./img/workstation.jpg "Workstation")

![Testbed](./img/testbed.jpg "Testbed")

There were a *lot* challenges with this project.  Getting the cloud set up, onboarding robots, and building the data pipeline were some highlights.  Thankfully I had a great team and we worked through each obstacle one by one.

Unfortunately, I don't have any photos of the application (which, while complex, was really neat) and the code is iRobot's IP.  However, I can build a mini-version that outlines some of the highlights.

# Robot Events
A demonstration of how to create tools that allow users to
- easily find robot event data 
- export the data for use with existing internal software tools
- share their data across the organization

I also considered how automate work in the future.  For example, rather than save the data locally, it would be great to send the data produced along to another API or script that mimicked existing software.

## Keeping Things Simple
This presentation is supposed to be short, so we are going to keep things dead simple.  That means no auth implementation, unit testing, containerization, etc.  You're so terribly disappointed, I can tell.

At the most basic level, this tool grants users access to a data store, in this case MongoDB.  In practice, the same techniques could be used to search log files or data from other APIs.  

FastApi with Uvicorn is a nice quick way to create API routes using Python, which in turn can connect to Mongo using the pymongo plugin.  

Finally, we have a React app that presents a simple user interface so that users can sift through the data without having to learn SQL.

## Data Generation

First, we will create some users.  MongoDB has a built-in USER_ROLES collection/table, and that allows very precise control over what users can and cannot do.  But it's overkill for this demo, so we can just create a "User" collection.

    db.user.insertMany([
        {username: "Arthur", password: "kingofthewho", robots: ["blackknight", "bridgekeeper", "patsy", ]},
        {username: "Lancelot", password: "youreinterribledanger", robots: ["Zoot", "bridgekeeper", "patsy"]},
        {username: "Galahad", password: "ericidleindisguise", robots: ["Zoot", "bridgekeeper", "patsy"]},
        {username: "Robin", password: "sirrobinranaway", robots: ["Zoot", "bridgekeeper", "patsy"]}
    ])

Likewise, let's create some robot event data:

    db.robot_event.insertMany([
        {robot: "blackknight", status: "active", description: "None Shall Pass.", createdAt: ISODate("2025-07-09T10:29:05Z")},
        {robot: "blackknight", status: "error", description: "Your arm's off!", createdAt: ISODate("2025-07-09T10:30:00Z")},
        {robot: "blackknight", status: "active", description: "It's a flesh wound", createdAt: ISODate("2025-07-09T10:30:05Z")},
        {robot: "blackknight", status: "maintenance", description: "I'll bite your legs off!", createdAt: ISODate("2025-07-09T10:30:15Z")},
        {robot: "patsy", status: "active", description: "Come along, Patsy", createdAt: ISODate("2025-07-08T13:30:15Z")},
        {robot: "patsy", status: "active", description: "coconut noises", createdAt: ISODate("2025-07-08T09:30:15Z")},
        {robot: "patsy", status: "inactive", description: "And they ate their minstrels, and there was much rejoicing.", createdAt: ISODate("2025-07-10T13:30:15Z")},
        {robot: "Zoot", status: "active", description: "Oh, sh*t.", createdAt: ISODate("2025-07-09T13:30:15Z")},
        {robot: "bridgekeeper", status: "active", description: "What is your name?", createdAt: ISODate("2025-07-11T15:30:15Z")},    
        {robot: "bridgekeeper", status: "active", description: "What is your quest?", createdAt: ISODate("2025-07-11T15:30:20Z")},    
        {robot: "bridgekeeper", status: "active", description: "What is your favorite color?", createdAt: ISODate("2025-07-11T15:30:25Z")},    
        {robot: "bridgekeeper", status: "active", description: "What is your name?", createdAt: ISODate("2025-07-11T15:31:15Z")},    
        {robot: "bridgekeeper", status: "active", description: "What is your quest?", createdAt: ISODate("2025-07-11T15:31:20Z")},    
        {robot: "bridgekeeper", status: "active", description: "What is the capital of Assyria?", createdAt: ISODate("2025-07-11T15:31:25Z")},  
        {robot: "bridgekeeper", status: "active", description: "What is your name?", createdAt: ISODate("2025-07-11T15:33:15Z")},    
        {robot: "bridgekeeper", status: "active", description: "What is your quest?", createdAt: ISODate("2025-07-11T15:33:20Z")},    
        {robot: "bridgekeeper", status: "active", description: "What is the airspeed velocity of an unladen swallow?", createdAt: ISODate("2025-07-11T15:33:25Z")},  
        {robot: "bridgekeeper", status: "inactive", description: "I don't know that.", createdAt: ISODate("2025-07-11T15:33:35Z")},  
    ])

Again, this data is simplified for demonstration purposes.  In reality, iRobot struggled to keep each robot "shadow" entry under 1MB, which required the data pipeline group to make some hard choices regarding data retention.

## OK, Let's Take a Look at the App, Already

Right.  Let's fire it up.  

    uvicorn main:app --reload     *Runs uvicorn/FastApi*

    npm run dev                   *Runs React*

\<pause for applause...\>

## Architecture Choices 

- What should happen on the front end?
- What should happen on the back end?

These choices are driven by the needs of the user and the organization, *not* by technology.

The filter controls *could* have been written in a more traditional way, such that every filter change hit an API endpoint and returned a new database result.  But this technique would be slower for the user and would unnecessarily tax the database.

The export function *could* have been part of the front-end code, and this would, in fact, be faster than using an API call.  But that would mean this export would only be useful for the current user.  By using a GET API call, the dataset becomes shareable across the organization.  For example

> "Hey Bill, I think there's something wrong with Patsy.  Check out http://127.0.0.1:8000/v1/export_robot_event?robot=patsy&format=json"

or 

> "Looks like some robots were losing legs last week.  See http://127.0.0.1:8000/v1/export_robot_event?dateFrom=2025-07-09&dateTo=2025-07-10&format=json"

## APIs, Automation and YOU!

Going even further, an easily-accessable API with good/fine/barely passable documenation (http://127.0.0.1:8000/docs), can allow other users in the organization to automate workflows.  Another script, program or API can use this API as input for further data processing.  

The resulting script becomes even more powerful as we add more API inputs.  The National Oceanic and Atmospheric Association provides great APIs that both forecast weather for a given location and provide historical weather data for a given location.  So we could write a script that looks at our robot event data between July 9-11:

    http://127.0.0.1:8000/v1/export_robot_event?dateFrom=2025-07-09&dateTo=2025-07-11&format=json

And see if it was raining that day:

    https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&stationid=GHCND:USW00014739&startdate=2024-07-09&enddate=2024-07-11&datatypeid=TMAX,TMIN,PRCP  (requires access token, alas)

To infer whether rain is correlated to robots changing their status to "inactive".

Aside: I showed testing technicians at iRobot how to write python scripts that would check the weather forecast 
    https://api.weather.gov/gridpoints/BOX/64,95/forecast/hourly
so they could avoid testing robot lawn mowers in the rain.

## Things Change. Or, Why We Need Versioning

Notice that our API has that little `/v1` in the url.  That is there because APIs change: We add endpoints, we add more functionality to an endpoint, we require new parameters.  The robots change, too.  Our demo robots have only a few options for "status", but real robots would certainly have more - in fact, the "status" attribute might even change into its own complex object.  Even within the same robot category (e.g. spot), the data they log might change based on hardware tweaks and firmware versions.  The API version at least lets us nail down specifications for robot events for a certain point in time.  Versioning also means that we don't break our users' code when our API changes.

## Ok, Wrap It Up, Buddy

I had a great professor, [Bruce Molay](https://coursebrowser.dce.harvard.edu/course/introduction-to-c-unix-linux-programming-and-web-interfaces/), who taught a course on Unix programming.  He could do more in a single line than most people could do with a full program.  

One of his main topics of discussion was the power of piping in shell scripting.  His point was that if a command  was written well, so that all of the possible inputs and outputs were known, you could use and reuse that command in conjunction with other commands.  For example:

    find . -type f -mtime 0 | xargs ls -lh | awk '{print $5, $9}'

uses the `find` command with a required argument and a couple of optional arguments to get files that were modified today.  The `xargs` command takes the find output and lists `ls -lh` the files.  Finally, `awk` is used to print the fifth and ninth columns of the resulting list.  

APIs should expose code in the same way.  With known inputs (path variables, post/put data, querystrings), a user should be able to expect known outputs.  These known outputs can then be used in other APIs that can yield deeper insights into data, automate processes, and create synergy.  Sorry.  I couldn't resist.

I know a lot of this is old hat for you - Thanks for listening.

Questions?