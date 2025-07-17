# Testing Roombas at iRobot - Challenges and Solutions
At iRobot a lot of our Roomba reliability testing was manual.  An engineer would physically baby-sit robots through missions and would read the resulting data directly from the robots when they were done.  Given that the robots constantly "talked" to the cloud (at least in production), there seemed room to automate the process with the ultimate goal of moving the testing offshore, either to Mexico or China.

What we envisioned was a testing facility where many robots running on testbeds could be monitored by a technician at a workstation using a web interface.  Using the web interface, the technician could easily see when robots were stuck, out of batteries or broken and move to address the problem.  Additionally, we set up our own testing cloud to capture all of the events the robots were reporting in order to derive metrics like mean-time-to-failure, mean-battery-life, etc.

![Workstation](./img/workstation.jpg "Workstation")

![Testbed](./img/testbed.jpg "Testbed")

There were a *lot* challenges with this project.  Getting the cloud set up, onboarding robots, and building the data pipeline were some highlights.  Thankfully I had a great team and we worked through each obstacle one by one.

Unfortunately, I don't have any photos of the application (which, while complex, was really neat) and the code is iRobot's IP.  However, I can build a mini-version that outlines some things I talked about with Nate.

# BD Robot Events
A demonstration of how to create tools that allow users to
- easily find robot event data 
- export the data for use with existing internal BD software tools
- share their data across the organization

Nate and I also talked about how to automate work in the future.  For example, rather than save the data locally, it would be great to send the data produced along to another API or script that mimicked the existing BD software.

## Keeping things simple
This presentation is supposed to be short (20 minutes), so we are going to keep things dead simple.  That means no auth implementation, unit testing, containerization, etc.  You're all so terribly disappointed, I can tell.

At the most basic level, this tool grants users access to a data store, in this case MongoDB.  In practice, the same techniques could be used to search log files or data from other APIs.  

FastApi with Uvicorn is a nice quick way to create API routes using Python, which in turn can connect to Mongo using the pymongo plugin.  

Finally, we have a React app that presents a simple user interface so that users can sift through the data without having to learn SQL.

## Data generation

First, we will create some users.  MongoDB has a built-in USER_ROLES collection/table, and that allows very precise control over what users can and cannot do.  But it's overkill for this demo, so we can just create a "BDUser" collection.

    db.bduser.insertMany([
        {name: "Arthur", robots: ["blackknight", "bridgekeeper", "patsy", ]},
        {name: "Lancelot", robots: ["Zoot", "bridgekeeper", "patsy"]},
        {name: "Galahad", robots: ["Zoot", "bridgekeeper", "patsy"]},
        {name: "Robin", robots: ["Zoot", "bridgekeeper", "patsy"]}
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

## Ok, let's take a look at the app!

Right.  Let's fire it up.  

    uvicorn main:app --reload     *Runs uvicorn/FastApi*

    npm run dev                   *Runs React*

\<pause for applause...\>
