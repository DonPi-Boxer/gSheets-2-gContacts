function importCsvFiles(folderName, skipHeader) {
  var folderName = "City-Volt-Potentials-CSV"
  var skipHeader = true
  const folder = DriveApp.getFoldersByName(folderName).next();
  const files = folder.getFiles();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const potSHAverage = parseFloat(49.94);
  let headerWritten = false

  while (files.hasNext()){

    //Get file and it's data
    const file = files.next();
    const data = file.getBlob().getDataAsString();
    // This CSV includes the header, which we do not want
    const csvWithHeader = Utilities.parseCsv(data, ',');
    // This CSV consists of only the values
    const csv = csvWithHeader.splice(1, csvWithHeader.length -1);
    Logger.log("CSV is " + csv);

    //Now we want to get the average for this CSV
    const potentialCollumns = [1];
    const muncipalVoltPottrings = csv.map(r => potentialCollumns.map(i => r[i]));
    const muncipalVoltPotFloats = muncipalVoltPottrings.map(value => (parseFloat(value)))
    Logger.log("Volt potential floats equals " + muncipalVoltPotFloats + " type is " + typeof(muncipalVoltPotFloats[0][0]));
    const muncipalVoltPotAverage = parseFloat(muncipalVoltPotFloats.reduce((a,b) => a+b)/   muncipalVoltPotFloats.length);
    Logger.log("Average equals " + muncipalVoltPotAverage);
    const lastRow = sheet.getLastRow();
    //Get title of the CSV
    // This title of the CSV includes characters we do not want
    const csvTitle = file.getName();
    const cityNameOnly = csvTitle.substring(
     csvTitle.indexOf("-") + 1,
     csvTitle.indexOf("_")
   );
    Logger.log("CityName is " + cityNameOnly);

    const rangeOfCityName = sheet.getRange(lastRow+1, 1, csv.length, 1);
    const rangeOfCSVInput = sheet.getRange(lastRow+1, 2, csv.length, csv[0].length);
    const rangeOfmuncipalVoltPot = sheet.getRange(lastRow+1, 3, csv.length, csv[0].length); 

    rangeOfCityName.setValue(cityNameOnly);
    rangeOfCSVInput.setValues(csv);

    const rangeToSetAverage = sheet.getRange(lastRow+csv.length + 1, 1, 1, 3);
    rangeToSetAverage.setValues([[cityNameOnly, "Gemiddelde", muncipalVoltPotAverage]]);

    //Check if neighborhood value above or under the average of the municipial --> append this to the 4th row

    for (i=0; i<csv.length + 1; i++){
      const hoodPotRange = sheet.getRange(lastRow + 1 + i, 3 , 1, 1);
      const hoodPot = parseFloat(hoodPotRange.getValue());
      Logger.log("Hoodpot equals " + hoodPot + " and is type " + typeof(hoodPot));
      const hoodComparMuncRange = sheet.getRange(lastRow + 1 + i , 4 , 1);
      const hoodComparProvince = sheet.getRange(lastRow + 1 + i, 5, 1); 
        if (parseFloat(hoodPot) < muncipalVoltPotAverage)
        {
          hoodComparMuncRange.setValue("Lower");
        }
        else if (hoodPot == muncipalVoltPotAverage)
        {
          hoodComparMuncRange.setValue("Equal");
        }
        else 
        {
          hoodComparMuncRange.setValue("Higher");
        }
        if (hoodPot < potSHAverage)
          {
            hoodComparProvince.setValue("Lower");
          }
        else if (hoodPot == potSHAverage)
          {
            hoodComparProvince.setValue("Equal");
          } 
        else
        {
          hoodComparProvince.setValue("Higher");
        }
   }
  }
}
function main(){
  var name_folder = 'CSV FILES'
  var skip_header = true
  importCsvFiles(name_folder, skip_header)
}
