db.bduser.drop()

db.bduser.insertMany([
    {username: "Arthur", password: "kingofthewho", robots: ["blackknight", "bridgekeeper", "patsy", ]},
    {username: "Lancelot", password: "youreinterribledanger", robots: ["Zoot", "bridgekeeper", "patsy"]},
    {username: "Galahad", password: "ericidleindisguise", robots: ["Zoot", "bridgekeeper", "patsy"]},
    {username: "Robin", password: "sirrobinranaway", robots: ["Zoot", "bridgekeeper", "patsy"]}
])
