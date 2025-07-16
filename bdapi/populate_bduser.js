db.bduser.drop()

db.bduser.insertMany([
    {name: "Arthur", password: "kingofthewho", robots: ["blackknight", "bridgekeeper", "patsy", ]},
    {name: "Lancelot", password: "youreinterribledanger", robots: ["Zoot", "bridgekeeper", "patsy"]},
    {name: "Galahad", password: "ericidleindisguise", robots: ["Zoot", "bridgekeeper", "patsy"]},
    {name: "Robin", password: "sirrobinranaway", robots: ["Zoot", "bridgekeeper", "patsy"]}
])
