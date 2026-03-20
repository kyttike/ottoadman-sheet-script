function setup() {
    if (ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === "update")) return; // Return if Update already exists
    ScriptApp.newTrigger("update") // Create new Trigger
      .timeBased()
      .everyMinutes(5)
      .create();
}

function test() {
}

function populateConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Config');

  // Player Inventories
  sheet.getRange(5, 9, 1000).clearContent();
  var playerValues = sheet.getRange("H5:H").getValues();
  var playerList = []

  playerValues.forEach(function(element, index) {
    if (element[0] !== "") {
      var id = element[0]
      playerList.push({id, index})
    }
  });

  playerList.forEach(player => {
    var response = UrlFetchApp.fetch("https://bitjita.com/api/players?q=" + player.id);
    var players = JSON.parse(response.getContentText()).players;

    players.forEach(playerBlob => {
      if (playerBlob.username == player.id) {
        sheet.getRange(5 + player.index, 9).setValue(playerBlob.entityId);
        return;
      }
    });
  });

  // House Inventories
  sheet.getRange(5, 13, 1000, 2).clearContent();
  var houseValues = sheet.getRange("K5:K").getValues();
  var housePlayerList = []

  houseValues.forEach(function(element, index) {
    if (element[0] !== "") {
      var id = element[0]
      housePlayerList.push({id, index})
    }
  });

  housePlayerList.forEach(player => {
    var response = UrlFetchApp.fetch("https://bitjita.com/api/players?q=" + player.id);
    var players = JSON.parse(response.getContentText()).players;

    players.forEach(playerBlob => {
      if (playerBlob.username == player.id) {
        sheet.getRange(5 + player.index, 13).setValue(playerBlob.entityId);

        try {
          var houseResponse = UrlFetchApp.fetch("https://bitjita.com/api/players/" + playerBlob.entityId + "/housing")
          var house = JSON.parse(houseResponse.getContentText());
          sheet.getRange(5 + player.index, 14).setValue(house[0].buildingEntityId);
          return;
        } catch (error) {
          sheet.getRange(5 + player.index, 14).setValue("No house");
        }
      }
    });
  });
}

function update() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(); //get active spreadsheet (bound to this script)
  const importSheet = ss.getSheetByName('Import'); //The name of the sheet tab where you are sending the info
  const configSheet = ss.getSheetByName('Config')

  // Claim inventories
  const claimId = configSheet.getRange(["C2"]).getValue()
  const claimPrefix = configSheet.getRange(["C5"]).getValue()
  var response = UrlFetchApp.fetch("https://bitjita.com/api/claims/" + claimId + "/inventories"); // get api endpoint
  var jsonRawData = JSON.parse(response.getContentText())

  // Code to convert the BitJita response to be similar in layout to our old method
  var buildings = jsonRawData.buildings
  var items = jsonRawData.items
  var cargos = jsonRawData.cargos
  let jsonData = []

  Object.values(buildings).forEach(building => {
    if (building.buildingNickname && building.buildingNickname.startsWith(claimPrefix)) {

      let rawInv = building.inventory
      let parsedInv = []

      for (item of rawInv) {
        let id = item.contents.item_id
        let tier = 0
        let qnt = item.contents.quantity
        let type = item.contents.item_type

        if (type == "item") {
          for (itemDesc of items) {
            if (itemDesc.id == id) {
              id = itemDesc.name
              tier = itemDesc.tier
            }
          }
        } else {
          for (cargoDesc of cargos) {

            if (cargoDesc.id == id) {
              id = cargoDesc.name
              tier = cargoDesc.tier
            }
          }

          if (id.includes("Package")) {
            id = id.replace(" Package", "")
            id = id.replace("Wood Plank", "Plank")
            id = id.replace("Stone Carving", "Stone Carvings")
            if (id.includes("Clay Lump") || id.includes("Fillet") || id.includes("Tannin") || id.includes("Bark") || id.includes("Pitch") || id.includes("Flower")) {
              qnt = qnt * 500
            } else if (id.includes("Fiber") || id.includes("Pebbles") || id.includes("Fish Oil")) {
              qnt = qnt * 1000
            } else if (id.includes("Pigment") || id.includes("Parchment")) {
              qnt = qnt * 200
            } else {
              qnt = qnt * 100
            }
          }
        }

        parsedInv.push([id, tier, qnt])
      }

      jsonData.push([
        building.buildingNickname,
        parsedInv
      ])
    }
  });

  // House inventories
  var allHouseEntries = configSheet.getRange("L5:N").getValues();
  var houseEntries = [];

  for (var i = 0; i < allHouseEntries.length; i++) {
    var prefix = allHouseEntries[i][0]; // Column L
    var playerID = allHouseEntries[i][1]; // Column M
    var houseID = allHouseEntries[i][2];  // Column N

    // Skip empty rows (both cells empty)
    if (playerID == "" || houseID == "" || houseID == "No house") {
      continue;
    }

    houseEntries.push({
      prefix: prefix,
      playerID: playerID,
      houseID: houseID
    });
  }

  for (var house of houseEntries) {
    var houseResponse = UrlFetchApp.fetch("https://bitjita.com/api/players/" + house.playerID + "/housing/" + house.houseID);
    var houseJsonRawData = JSON.parse(houseResponse.getContentText());
    var houseInventories = houseJsonRawData.inventories
    var houseItems = houseJsonRawData.items
    var houseCargos = houseJsonRawData.cargos

    // House sum
    Object.values(houseInventories).forEach(inventory => {
      if (inventory.buildingNickname && inventory.buildingNickname.startsWith(house.prefix)) {
        let rawInv = inventory.inventory
        let parsedInv = []

        for (item of rawInv) {
          let id = item.contents.item_id
          let tier = 0
          let qnt = item.contents.quantity
          let type = item.contents.item_type

          if (type == "item") {
            for (itemDesc of houseItems) {
              if (itemDesc.id == id) {
                  id = itemDesc.name
                  tier = itemDesc.tier
              }
            }
          } else {
            for (cargoDesc of houseCargos) {
              if (cargoDesc.id == id) {
                id = cargoDesc.name
                tier = cargoDesc.tier
              }
            }

            if (id.includes("Package")) {
              id = id.replace(" Package", "")
              id = id.replace("Wood Plank", "Plank")
              id = id.replace("Stone Carving", "Stone Carvings")
              if (id.includes("Clay Lump") || id.includes("Fillet") || id.includes("Tannin") || id.includes("Bark") || id.includes("Pitch") || id.includes("Flower")) {
                qnt = qnt * 500
              } else if (id.includes("Fiber") || id.includes("Pebbles") || id.includes("Fish Oil")) {
                qnt = qnt * 1000
              } else if (id.includes("Pigment") || id.includes("Parchment")) {
                qnt = qnt * 200
              } else {
                qnt = qnt * 100
              }
            }
          }

          parsedInv.push([id, tier, qnt])
        }

        jsonData.push([
          inventory.buildingNickname,
          parsedInv
        ]);
      }
    });
  }

  // Player inventories
  var allPlayerIDs = configSheet.getRange("I5:I").getValues();
  const playerIDs = allPlayerIDs.filter(elem => elem[0] != "" && elem[0] != null)
  const importBanks = configSheet.getRange(["C7"]).getValue()

  // Player sum
  Object.values(playerIDs).forEach(playerID =>
  {
    var playerInventoryResponse = UrlFetchApp.fetch("https://bitjita.com/api/players/" + playerID + "/inventories")
    var playerInventoryJsonRawData = JSON.parse(playerInventoryResponse.getContentText())

    var playerInventories = playerInventoryJsonRawData.inventories
    var playerItems = playerInventoryJsonRawData.items
    var playerCargos = playerInventoryJsonRawData.cargos

    Object.values(playerInventories).forEach(inventory => {
      if (inventory.inventoryName == "Town Bank" && !importBanks) {
        return
      }

      if (inventory.inventoryName == "Toolbelt") {
        return
      }

      let rawInv = inventory.pockets
      let parsedInv = []

      if (rawInv.length != 0) {
        if (!importBanks && inventory.BuildingName.startsWith("Town Bank")) {
          return
        }
        for (item of rawInv) {
          let id = item.contents.itemId
          let tier = 0
          let qnt = item.contents.quantity
          let type = item.contents.itemType

          if (type == 0) {
            Object.keys(playerItems).forEach(function(key) {
              if (id == key) {
                var item = playerItems[key]
                id = item.name
                tier = item.tier
              }
            });
          } else {
            Object.keys(playerCargos).forEach(function(key) {
              if (id == key) {
                var item = playerCargos[key]
                id = item.name
                tier = item.tier
              }
            });

            if (id.includes("Package")) {
              id = id.replace(" Package", "")
              id = id.replace("Wood Plank", "Plank")
              id = id.replace("Stone Carving", "Stone Carvings")
              if (id.includes("Clay Lump") || id.includes("Fillet") || id.includes("Tannin") || id.includes("Bark") || id.includes("Pitch") || id.includes("Flower")) {
                qnt = qnt * 500
              } else if (id.includes("Fiber") || id.includes("Pebbles") || id.includes("Fish Oil")) {
                qnt = qnt * 1000
              } else if (id.includes("Pigment") || id.includes("Parchment")) {
                qnt = qnt * 200
              } else {
                qnt = qnt * 100
              }
            }
          }

          parsedInv.push([id, tier, qnt])
        }
      }

      if (parsedInv.length > 0) {
        jsonData.push([
          inventory.inventoryName,
          parsedInv
        ])
      }
    })
  });

  // Group items
  const itemsSum = new Map();
  for (const chest of jsonData) {
    const items = chest[1];
    const chestName = chest[0];

    for (const item of items) {
      // item = ["Item Name", Tier, Quantity]
      let itemName = item[0];
      const itemTier = parseInt(item[1]);
      let itemQuantity = parseInt(item[2]);

      if (itemsSum.has(itemName)) {
        const oldVal = parseInt(itemsSum.get(itemName)[1]); // The quantity
        let chests = itemsSum.get(itemName)[2];

        if (!chests.includes(chestName)) {
          chests.push(chestName);
        }

        itemsSum.set(itemName, [itemTier, oldVal + itemQuantity, chests]);
      } else {
        itemsSum.set(itemName, [itemTier, itemQuantity, [chestName]]);
      }
    }
  }

  const wordsToRemove = ["Basic ", "Sturdy ", "Rough ", "Simple ", "Infused ", "Fine ", "Exquisite ", "Peerless ", "Ornate ", "Pristine ", "Magnificent ", "Flawless ", "Beginner's ", "Novice ", "Essential ", "Proficient ", "Advanced ", "Comprehensive ", "Ferralith ", "Pyrelite ", "Emarium ", "Elenvar ", "Luminite ", "Rathium ", "Aurumite ", "Celestium ", "Umbracite ", "Astralite ","Magnificient "]

  const data = Array.from(itemsSum, ([key, valueArray]) => {
    let normalizedName = key;
    wordsToRemove.forEach(word => {
      normalizedName = normalizedName.replace(word, '');
    });

    normalizedName = normalizedName.trim();

    // Join chest names into a string for export
    return [normalizedName, valueArray[0], valueArray[1], valueArray[2].join(', ')];
  });

  importSheet.getRange(2, 2, 1000, 4).clear();
  importSheet.getRange(2, 2, data.length, 4).setValues(data);
}
