db.robot_event.drop()

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