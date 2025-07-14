# BD Robot Events
A demonstration of how to create tools that allow users to
- easily find robot event data 
- export the data for use with existing internal BD software tools
- share their data across the organization

We also talked about how to automate work in the future.  For example, rather than save the data locally, it would be great to send the data produced along to another API or script that mimicked the existing BD software.

## Keeping things simple
This presentation is supposed to be short (20 minutes), so we are going to keep things dead simple.  That means no auth implementation, unit testing, containerization, etc.  You're all so terribly disappointed, I can tell.

At the most basic level, this tool grants users access to a data store, in this case MongoDB.  In practice, the same techniques could be used to search log files or data from other APIs.  

FastApi with Uvicorn is a nice quick way to create API routes using Python, which in turn can connect to Mongo using the pymongo plugin.  

Finally, we have a React app that presents a simple user interface so that users can sift through the data without having to learn SQL.



