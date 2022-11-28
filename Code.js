// Link to google Spreadsheet:
// https://docs.google.com/spreadsheets/d/1OmorzZyeV6XJW5UrYhfeu6KkyeicIK3xZfvtvJj71SY/edit#gid=0

//Declare all constants
//Pushshshshs
var cGroup1Index = 0;
var cGroup2Index = 1;
var cGroup3Index = 2;
var cGroup4Index = 3;

var cGroupIndices = [cGroup1Index, cGroup2Index, cGroup3Index, cGroup4Index];
var cGroupsLength = cGroupIndices.length;

var lastNameIndex = 4;
var firstNameIndex = 5;
var emailIndex = 6;
var mobileIndex = 7;
var statusIndex = 8;
var headerRows = 2;

var ui = SpreadsheetApp.getUi();

// Sheet constants
var sheet = SpreadsheetApp.getActiveSheet();
var ss = SpreadsheetApp.getActiveSpreadsheet();
var headerRows = 2;
var numColsContacts = 7;
var startColContacts = 1;
var MaxRow = sheet.getLastRow();
var dataRange = sheet.getDataRange();
var data = dataRange.getValues();     // Read all data
data.splice(0,headerRows);            // Remove header rows
var existingContactgroups = SpreadsheetApp.getActiveSheet().getRange(1, cGroupsLength, MaxRow).getValues();
var userProperties = PropertiesService.getUserProperties();
var userCache = CacheService.getUserCache();

//get Contact by email adress (created function to be able to use .map function in the container functions)
function getContactsByMailAddress(mailAdress){
  let contacts = ContactsApp.getContactsByEmailAddress(mailAdress);
  if (contacts != "" && contacts){
    return contacts;
  }
  else{
    ui.prompt("contacts not found, it is " + contacts + " type is " + typeof(contacts));
    return undefined;
  }
}

function getContactMailAdressOfMailObject(mailObject){
  let mailAdresses = mailObject.getAddress();  
  if (mailAdresses != "" && mailAdresses){
    return mailAdresses;
  }
  else {
    return undefined;
  }
}

function getContactMails(contact){
  let contactMailObject = contact.getEmails();
  let contactMails = contactMailObject.map(getContactMailAdressOfMailObject);

  if (contactMails != "" && contactMails){
    return contactMails;
  }
  else{
  return undefined;
  }
}

function doesContactMailExist(mailAdress){ 
  contacts = getContactsByMailAddress(mailAdress);
  if (contacts != "" && contacts){
    let contactMails = contacts.map(getContactMails); 
    return contactMails;
  }
  else {
    return undefined;
  }
}
  
// Underneath is all about importing the contact to google contacts
function importContacts() {
  var dummy = ContactsApp.getContact("nigeljansen1996@live.nl");
  //Get all the contact data, starting at row 4
 var newContactCount = 0;
 var newContactGroupCount = 0;
  for (var i=4; i<= sheet.getLastRow(); i++)  {
    var rowmatrix= sheet.getRange(i, 1, 1, sheet.getLastColumn()).getValues();
    var row = rowmatrix[0];  

    //Only if an email adress exists, we go see to add the contact

    var emailAdd = row[mobileIndex];
    if (emailAdd){
      var doesContactAlreadyExist = doesContactMailExist(emailAdd); 
      
      if (doesContactAlreadyExist){
        var contact = getContactsByMailAddress(emailAdd);

        //todo als naam al van contact is zelfde --> niet toevoegen
        // Also, dubble check if contact does not exist in contact groups yet

        // Check if the phone number already exists for this contact, if not, add. Do the same for the
        // CGroup dimensions. For now, just break the function to fix the rest.
        continue;
    }
      else if (! doesContactAlreadyExist) {
      //ui.prompt("email adress does not exist yet, adding now ");
      newContactCount = newContactCount + 1;
       
      var lastName = row[lastNameIndex];
      var firstName = row[firstNameIndex]; 
      var mobileAdd = row[emailIndex];
      var companyTypeAdd = row[cGroup1Index];
      var teamAdd = row[cGroup3Index];
      var companyAdd = row[cGroup2Index];
      var positionAdd = row[cGroup4Index];
      var newContact = ContactsApp.createContact(firstName, lastName, emailAdd);
      if (mobileAdd != "" ) {
        newContact.addPhone(ContactsApp.Field.MOBILE_PHONE, mobileAdd);
      }
      if (companyAdd != ""){
      
        if (positionAdd !="") {
          newContact.addCompany(companyAdd, positionAdd);
        }
          else if (companyAdd != "" && positionAdd ==""){
            newContact.addCompany(companyAdd, "");
            }

          }

        //Creating teamLabels underneath
        // IF BOTH TEAM AND COMPANY GIVEN __> create label team and company
        if (teamAdd !=""){
          let contactGroupName = companyAdd + " - " + teamAdd; 
          let contactGroup = findOrCreateContactGroup(contactGroupName);
          contactGroup.addContact(newContact);
          newContactGroupCount = newContactGroupCount + 1;
          // ALSO ADD A FIELD WITH TEAM ?
        }
        //Create company type label
        if (companyTypeAdd != ""){
        let contactGroup = findOrCreateContactGroup(companyTypeAdd);
        ui.alert("adding to contact group of only company type: " + companyTypeAdd);
        contactGroup.addContact(newContact);      
          //create companytype and team label
          if (teamAdd != ""){
            var contactGroupName = createMergedContactGroupName([companyTypeAdd, teamAdd]);
            contactGroup = findOrCreateContactGroup(contactGroupName);
            ui.alert("adding to contact group of company type and team: " + contactGroupName);
            contactGroup.addContact(newContact);
            newContactGroupCount = newContactGroupCount + 1;
            //create company type, team and position label
            if (positionAdd != ""){
              contactGroupName = createMergedContactGroupName([companyTypeAdd, teamAdd, positionAdd]);
              contactGroup = findOrCreateContactGroup(contactGroupName);
              ui.alert("adding to contact group of type, team and role: " + contactGroupName);
              contactGroup.addContact(newContact);
              newContactGroupCount = newContactGroupCount + 1;
            }
          }
        }
      }
    }
  }
  ui.alert("Added " + newContactCount + " new contacts and " + newContactGroupCount + " new contact groups");
}

function createMergedContactGroupName(contactGroupsToAddArray){
  ui.prompt("contact groups to add awway: " + contactGroupsToAddArray);
  var mergedContactGroupName = contactGroupsToAddArray[0];
  ui.alert("entering loop");
  for (let i = 1; i < contactGroupsToAddArray.length; i++){
    ui.alert("inside loop, merged name is " + mergedContactGroupName + " we add " + contactGroupsToAddArray[i]);
    mergedContactGroupName = mergedContactGroupName + " - " + contactGroupsToAddArray[i];  
  }
  ui.prompt("merged contact group names equals " + mergedContactGroupName);
  return mergedContactGroupName;
}

function findOrCreateContactGroup(contactGroupName){
  let contactGroup = getContactGroup(contactGroupName);
  if(contactGroup[0] == true){      
      return contactGroup[1];      
    }  
  else if (contactGroup[0] == false){
      createContactGroup(contactGroupName);
      contactGroup = getContactGroup(contactGroupName);
      let newContactGroup = contactGroup[1];
      return newContactGroup
  } 
}

function getContactGroup(contactGroupName){
  let contactGroup = ContactsApp.getContactGroup(contactGroupName);
    if (contactGroup){
      return [true, contactGroup]
    }
    else{
      return [false]
    }
}

function createContactGroup(contactGroupName) {
  var contactGroupString = contactGroupName.toString();
  var newContactGroup = People.ContactGroups.create({
      contactGroup: {
        name: contactGroupString
      }
    });
    return newContactGroup
}

//functions to cache and decache variables which might have to be stored in the local memory
function cacheNewContactGroupVariables(contactGroupDimensionNamesArray, iterationNotFound,lastFoundFirstRowExtreme, lastFoundLastRowExtreme){
  var valuesToCache = {
    'contactGroupDimensionNamesArray' : contactGroupDimensionNamesArray.toString(),
    'iterationNotFound' : iterationNotFound.toString(),
    'lastFoundFirstRowExtreme' : lastFoundFirstRowExtreme.toString(),
    'lastFoundLastRowExtreme' : lastFoundLastRowExtreme.toString()};    
  
    userCache.putAll(valuesToCache);    

}
function cacheFullContactCredentials(fullContactCredentials){
  userCache.put("fullContactCredentials", fullContactCredentials.toString());
}

  function getCachedContactCredentialsInArray(contactCredentialsToGet){ 
   
   var contactCredentialsToGetString = contactCredentialsToGet.toString(); 
   var contactCredentialsString = userCache.get(contactCredentialsToGetString); 
   var contactCredentials = contactCredentialsString.split(",");
    return contactCredentials;
  }

  function confirmSubmitDialog(fullContactCredentials){


    dialogFormHTMLTitle = 'confirm-submit.html';
    dialogTitle = "Confirm new contact";
  
    var modalDialog = createModalDialog(dialogFormHTMLTitle);
    modalDialog.cred_1 = fullContactCredentials[5].toString();
    modalDialog.cred_2 = fullContactCredentials[4].toString();
    modalDialog.cred_3 = fullContactCredentials[6].toString();
    modalDialog.cred_4 = fullContactCredentials[7].toString();
    modalDialog.cGroup_1 = fullContactCredentials[0].toString();
    modalDialog.cGroup_2 = fullContactCredentials[1].toString();
    modalDialog.cGroup_3 = fullContactCredentials[2].toString();
    modalDialog.cGroup_4 = fullContactCredentials[3].toString();
  
    setModalDialog(modalDialog, dialogTitle);
  }
  


  
  
  function confirmSumbit(formObject){ 
    var contactCredentialsConfirm = getCredentialsOfFormObject(formObject, false); 
    var initialCachedCredentials = "fullContactCredentials";
    var initialCredentials = getCachedContactCredentialsInArray(initialCachedCredentials);
    
    for (var i =0; i<initialCredentials.length; i++) {
      if (contactCredentialsConfirm[i]){
        initialCredentials[i] = contactCredentialsConfirm[i];
      }
    }

    // function runs into the getcredentials of form, but not further than there. where goes this wrong ?
    evaluateInputContactCreds(initialCredentials);
  }



  function addContacInitialInput(formObject){
    var fullContactCredentials = getCredentialsOfFormObject(formObject, true);
    var confirmNewContact = confirmSubmitDialog(fullContactCredentials);    
  }  


  //// Search the (grouped) range that has hadder name "GroupedRangeHeader", within the range startRow, numrows, collumn
//// Note that in this function, we do not yet use the fact that the range is grouped to find the group
//// Return it's starting row number if found, return false if not found.
//Ensure that the groupedRangeHeader is a string !!!


function  findContactGroupRowPositionExtremes(contactGroupHeader, firstRowPositionToSearch, lastRowPositionToSearch, collumnPositionToSearch) {  
  
  
  // The ammount of rows in which we want to search for the header is equal to the substraction of the lastRowPosition and FirstRowPosition + 1
  // +1 one, since we are dealing with POSITIONS here, not indices
  var numRowsToSearch = (lastRowPositionToSearch - firstRowPositionToSearch) + 1;
  
  //We than get the rangeToSearch by taking:
  //FirstRowPosition
  //CollumnPosition
  //NumRows
  // --> A single collumn existing out of the collumn to search of the row positions to search
  var rangeToSearch = sheet.getRange(firstRowPositionToSearch, collumnPositionToSearch, numRowsToSearch);


  //Get the values in this range
  var rangeToSearchValuesArrays = rangeToSearch.getValues();
 
  //Range to search values Arrays contains of arrays of arrays (depicting the string we search)
  // We wnat an array of strings to use the indexOf and lastindex of functions
  //--> force the array of string arrays into one long array
  //Then split it into one array of strings, at every "," in the entire arrays of the arrays of arrays
  //(Bullshit workaround but it works :))))))

  var rangeToSearchValues = String(rangeToSearchValuesArrays).split(",");
  

  var searchContactGroup = String(contactGroupHeader);
  //Use indexOf to find the first index of the GroupedRangeHeader
  var firstRowIndexcontactGroupDimension = rangeToSearchValues.indexOf(searchContactGroup);
  
  
  

  //Confirm that the first index is found by checking that the query did NOT return -1

  if (firstRowIndexcontactGroupDimension != -1){
  //Then use lastindex to find the last index of the GroupedRangeHeader
  //Note that last index and first index can have the same value, if only one row with the header exists
  var lastRowIndexOfGroupedRangeHeader = rangeToSearchValues.lastIndexOf(searchContactGroup);

  //Convert both found indices to position by adding it to the starting position of the Rows used for the search range  
  var firstRowPositionOfHeader = firstRowIndexcontactGroupDimension + firstRowPositionToSearch;
  var lastRowPositionOfHeader = lastRowIndexOfGroupedRangeHeader + firstRowPositionToSearch;


  return [true, firstRowPositionOfHeader, lastRowPositionOfHeader];
  }
  
  //This would mean that the contact group was not found :(). We return the extremes we had found in the previous iteration + the collumns that still need to be found
  else if (firstRowIndexcontactGroupDimension == -1){
  //Als grouped range niet gevonden is --> maak een nieuwe
  return [false, firstRowPositionOfHeader, lastRowPositionOfHeader];
    }

  }


  function findRowPositionOfNewContact(contactGroupNamesArray){
  var collumnsPositionsToSearchArray = [1,2,3,4];
  // For the 1st dimenstion, we want to search through the entire sheet, minus the headers
  
  //The row where the first contactgroup is place
  var firstRowPositionToSearch = 4;
  //Last row that contains data
  var lastRowPositionToSearch = ss.getLastRow();
  

 // for (var i=0; i < contactGroupNamesArray.length; i++)
  for (var i=0; i < collumnsPositionsToSearchArray.length; i++){


  //Get, from 1 to last, the contact group name you are searching for now
  var contactGroupDimensionToSearch = contactGroupNamesArray[i];
  //Get the collumn position, from 1 to last, of the contact group you are searching for now 
  var collumnPositionToSearch = collumnsPositionsToSearchArray[i];
  

  var rowRangeFoundcontactGroup = findContactGroupRowPositionExtremes(contactGroupDimensionToSearch, firstRowPositionToSearch, lastRowPositionToSearch, collumnPositionToSearch);
  

  Logger.log(rowRangeFoundcontactGroup);
    
  // If the contact group we are currently searching for is found in the current (collumn) range
  if (rowRangeFoundcontactGroup[0] == true){

  //Update the first and last row position to search for the next iteration , start the loop again and search for the next contact group in its corresponding collumn range
  firstRowPositionToSearch = rowRangeFoundcontactGroup[1];
  lastRowPositionToSearch = rowRangeFoundcontactGroup[2]; 
  }

  //If the contact group we are currently searching for is NOT found in the current (collumn) range
  else if (rowRangeFoundcontactGroup[0] == false){

    //The we put the collumn range of our last found contact group, the iteration and collumn name of group we were currently searching for in the get range of new contact group function

    //Return False so we know it was not found, i so we know how many iterations did not find a match (thus in which collumn), and the extremes of last contact group that we dit find
    
    //Als hier i = 0 --> fiks bug oeg toe BOVEN de alle eerste firstRowPositionToSearch
    
    return [false, i, firstRowPositionToSearch, lastRowPositionToSearch, contactGroupDimensionToSearch];
  }
    }

    // If the entire loop is finished without returning, this means all 4 levels of contact groups were found and we can add our new contact to this last found row position
    // NOTE: WE NOW HAVE TO SORT FOR THE Contacts by (First ?) name
    SpreadsheetApp.getActive().toast("leaving finding row functio, CONTACT WAS FOUND for poSITION " + lastRowPositionToSearch);
    return [true, firstRowPositionToSearch, lastRowPositionToSearch];    
}

function getRangeOfNewContactToAdd(rowPositionOfNewContact, fullContactCredentialsLength){
  //Get the range of the new contact  

  const rangeOfNewContact = sheet.getRange(rowPositionOfNewContact, 1, 1, fullContactCredentialsLength);
  return rangeOfNewContact;
}



//If none of the contact groups does not exist ready
function addContactAndNewContactGroup(fullContactCredentials){
  var lastRow = sheet.getLastRow();
  var fullContactCredentialsLength = fullContactCredentials.length;
  const rangeOfNewContact = getRangeOfNewContactToAdd(lastRow, fullContactCredentialsLength);
  rangeOfNewContact.setValues([fullContactCredentials]);
}

//If atleast one of the contact groups does exist already
//Insert a new row after the last found contact already existing inside all 4 corresponding contact group dimensions
function addContactToRowBelow(rowPositionAboveNewContact, fullContactCredentials){
  sheet.insertRowAfter(rowPositionAboveNewContact);
  const rowPositionOfNewContact = rowPositionAboveNewContact + 1;
  SpreadsheetApp.getActive().toast("appended succesfully")
  //Length of the entire contact Credentials array in order to succesfully grab a range to set the values of the credentials in
  const fullContactCredentialsLength = fullContactCredentials.length;
  const rangeOfNewContact = getRangeOfNewContactToAdd(rowPositionOfNewContact, fullContactCredentialsLength);
  rangeOfNewContact.setValues([fullContactCredentials]);
  SpreadsheetApp.getActive().toast("Added new contact !");
}

function addContactToRowAbove(rowPositionUnderNewContact, fullContactCredentials){
  const rowPositionOfNewContact = rowPositionUnderNewContact + 1;
  sheet.insertRowBefore(rowPositionOfNewContact); 
  const fullContactCredentialsLength = fullContactCredentials.length;
  const rangeOfNewContact = getRangeOfNewContactToAdd(rowPositionOfNewContact, fullContactCredentialsLength);
  SpreadsheetApp.getActive().toast("appended succesfully")
  //Length of the entire contact Credentials array in order to succesfully grab a range to set the values of the credentials in
  rangeOfNewContact.setValues([fullContactCredentials]);
  SpreadsheetApp.getActive().toast("Added new contact !");

}



//Parse all functions and let the magic happen niffo
//Note that this function gets call from the getCredentialsOfForm function
function evaluateInputContactCreds(fullContactCredentials) {

  //Get only the contact group dimensional names from the full contact credentials.
  var contactGroupDimensionNamesArray = fullContactCredentials.slice(0,4);
 
  // SpreadsheetApp.getActive().toast("Full contact credentials is " + fullContactCredentials);
  //Note: probably have to expand this variable in order to take non full contact group dimensions into account
  //Probably work something out using true false booleans ?
  var rowPositionOfLastContactInSameDimension = findRowPositionOfNewContact(contactGroupDimensionNamesArray);
  
  // TODO: search for the contact in alphabetical order ict the names of the ones in it's group
  //If the first entry True, we have found all four input dimension and we can simply add the new contact to its found row
  if (rowPositionOfLastContactInSameDimension[0] == true) {
  //TODO: Just remove a +1 here
  var firstRowPositionOfCGroup = rowPositionOfLastContactInSameDimension[1];
  var lastRowPositionOfCGroup = rowPositionOfLastContactInSameDimension[2];
  var collumnPositionToSearch = parseInt(lastNameIndex) + 1;
  //Zoek alfabetische positie op basis van
  var rowPositionOfNewContactArray = findSortedRowPosition(firstRowPositionOfCGroup, lastRowPositionOfCGroup, lastNameIndex + 1, collumnPositionToSearch);
  var rowPositionOfNewContact = parseInt(rowPositionOfNewContactArray[0]);

  // USE SORT FUNCTION TO FIND THE ALPHABWTICAL ORDER OF CONTACT NAMES


  //test if bug if cuased by new function
  addContactToRowAbove(rowPositionOfNewContact, fullContactCredentials);
  }

  //If the last entry is not true, cache all relevant variables for later. Run the modal for asking whether to add the new contact, or to alter the input Cgroups
  else if (rowPositionOfLastContactInSameDimension[0] == false){    
    var itertationNotFound = rowPositionOfLastContactInSameDimension[1];
    var collumnToSearch = itertationNotFound + 1;
    var lastFoundFirstRowExtreme = rowPositionOfLastContactInSameDimension[2];
    var lastFoundLastRowExtreme = rowPositionOfLastContactInSameDimension[3];
    var newContactGroupName = rowPositionOfLastContactInSameDimension[4];
    //Store the relevant variables wrt to the contact groups dimensions and their poitions
    cacheNewContactGroupVariables(contactGroupDimensionNamesArray, itertationNotFound,lastFoundFirstRowExtreme, lastFoundLastRowExtreme);

   
    //FUNCTION TO FIND THE SORTED POSITION OF THE NEW CONTACT GROUP
    var findSortedRow = findSortedRowPosition(lastFoundFirstRowExtreme, lastFoundLastRowExtreme, collumnToSearch, newContactGroupName);
    var rowPositionOfNewContact = findSortedRow[0];
   
    //Als de eerste nieuwe cGroup dimension uniek is, moet row position -1 EN we willen het eerste toegevoegde contact boven de sorted position hebben
    if (rowPositionOfLastContactInSameDimension[1] == 0){
      rowPositionOfNewContact = rowPositionOfNewContact - 1;
      createNewContactGroups(fullContactCredentials, rowPositionOfNewContact, true);
      }
     //Als de 1e unieke CGroup bovenaan de Alfabetische sorted row hoor, dan moet de 1e nieuwe entry bovenaan de lijst toegevoegd worden
     //Also, if we the 1st cGroup dimension is unique, add the new contact gorups above
    else if (findSortedRow[1] == 0 && rowPositionOfLastContactInSameDimension[1] != 0){ 
      //Nieuwe regel maken BOVEN NIEUWE POSITIE + 1, daarna naar createNewContactGroups function, met als contact groups de eerste er uit
      createNewContactGroups(fullContactCredentials, rowPositionOfNewContact, true);
      }   
    //Als de 1e unieke CGroup niet bovenaan de alfabetische sorted row hoort, en de alle eerste 1e cGroup dimension is niet uniek, dan moeten alle nieuwe cGroups onder elkaar toegevoegd worden
    else {  
      createNewContactGroups(fullContactCredentials, rowPositionOfNewContact, false);
      }
   
    }
  }

function findSortedRowPosition(firstRowToSearch, lastRowToSearch, collumnToSearch, stringToSearch) {
  //How big is the range of rows in which we have to search
  var numRowsToSearch = parseInt(lastRowToSearch) - parseInt(firstRowToSearch) + 1;

  // getRange return an array of stringarrays
  var stringsArrayRange = sheet.getRange(parseInt(firstRowToSearch),parseInt(collumnToSearch),parseInt(numRowsToSearch));
  const stringsArrayArrays = stringsArrayRange.getValues();
  
  
  // Now we return one array of strings
  const stringArrayWithEmptyStrings = String(stringsArrayArrays).split(",");
  //Remove all empty strings From the string array
  const stringArray = stringArrayWithEmptyStrings.filter(e =>  e);
  //append the string of which we want to know its alphabetical postion in the range to the stringarray
  const stringsArrayLowerCase = stringArray.map(element => {
    return element.toLowerCase();
  })
  stringsArrayLowerCase.push(stringToSearch.toString().toLowerCase());
  //Sort alphabetically
  stringsArrayLowerCase.sort();
  //Find the index of the string we want to know the alphabetical position of

  var indexOf = stringsArrayLowerCase.indexOf(stringToSearch.toString().toLowerCase());
  
  alphabeticalPositionOfNewString =  parseInt(indexOf) + parseInt(firstRowToSearch);
  return [alphabeticalPositionOfNewString, indexOf];

  //find index of new string
//Als sort position = 0 --> insert row position  above 
}  


function groupRowRange(rowPositionToGroup, numRowsToGroup, depthToShift) {
  SpreadsheetApp.getActive().toast("inside crearte row position function, shiftdepth: " + depthToShift);
  const rangeToGroup = sheet.getRange(rowPositionToGroup,1,numRowsToGroup,1);
  rangeToGroup.activate().shiftRowGroupDepth(depthToShift);
}

function unGroupRowRange(rowPositionToUnGroup, numRowsToUnGroup, depthToUnShift) { 
  var shiftDepth = parseInt(-1*depthToUnShift);
  var rangeToUnGroup = sheet.getRange(rowPositionToUnGroup,1,numRowsToUnGroup,1);
  rangeToUnGroup.activate().shiftRowGroupDepth(shiftDepth);

}


function createNewContactGroups(fullContactCredentials, rowPositionOfNewContact, firstCGroupInSortedRange){

  var contactGroupDimensionNames = fullContactCredentials.slice(0,4);   

  //TODO: without using userCache
  var cGroupDimensionPoisitionNotFound = parseInt(userCache.get('iterationNotFound'));

  var cGroupDimensionsLength = contactGroupDimensionNames.length;
  //Get the row under which we want to add the new contact
  var initialPositionoNewContactAndContactGroup = rowPositionOfNewContact;

  //change TO newRowPosition = given input variable name

  var fullContactCredentialsLength = fullContactCredentials.length;
  //var whatIsGroupNames = typeof(contactGroupDimensionNames);
  var cGroupDimensionsFound = contactGroupDimensionNames.slice(0,cGroupDimensionPoisitionNotFound);
  var cGroupDimensionsNotFound = contactGroupDimensionNames.slice(cGroupDimensionPoisitionNotFound, cGroupDimensionsLength);
 
  //First we add the new contact to the first Row position of which we know he fits wihtin the contact Group Dimensions   
  //Frst add the not yet found contact Groups as new Contact Groups to the list

  // Array to store in which rows (+1) we have added new contact groups in order to later create rowgroups in these rows
  var cGroupsToCreateLength = cGroupDimensionsNotFound.length-1;
  var rowGroupPositionsToAdd = [];
  
  //Als we alleen de laatste niet bekende CGroup hoeven toe te voegen (function), voeg alleen de volledige contact credentials toe BOVEN zijn sorted plek
  if (cGroupsToCreateLength == 0) {
    addContactToRowAbove(rowPositionOfNewContact, fullContactCredentials);
  }

  else{

  for (var i = 0; i< parseInt(cGroupsToCreateLength) + 1; i++) {
  
   
    cGroupDimensionsFound.push(cGroupDimensionsNotFound[i]);

    //Add the contact Groups
    //Note to change the name of this function to something like addObjectToRow

    
   //We used the fact that adding a new row underneath an existing row group, makes the new row part of the existing row groups above this new row.
   //Because the first not yet existing cgroup dimension wants to create it's own rowgroup dimension, we have to decrease this row's rowgroup by one.
    

   //Als we in de laatste iteratie zijn, voegen we de hele contact credentials toe (deze gaat tegelijk met cGroup level 4 )
   if (i === parseInt(cGroupsToCreateLength)){
    addContactToRowBelow(rowPositionOfNewContact, fullContactCredentials);
    groupRowRange(rowPositionOfNewContact +1, 1, 1);
    rowPositionOfNewContact = rowPositionOfNewContact + 1;
   }

   // In the first iteration of the loop, we add a new row under the position of the CGroups, which copies
   // ALL the existing row groups above. To remove (unshift) the groups with which we do not want to group (aka the non matching ones)
   // We unshift this row with the amount of levels of unique cGroups that it has.
   //Note that thus the cGroups that do Match with the new contact, stay intact
   else if (i === 0 && firstCGroupInSortedRange == false){
    
    addContactToRowBelow(rowPositionOfNewContact, cGroupDimensionsFound);
    unGroupRowRange(rowPositionOfNewContact +1, 1, cGroupsToCreateLength);       
    rowGroupPositionsToAdd.push(rowPositionOfNewContact); 
    rowPositionOfNewContact = rowPositionOfNewContact + 1;  
   }
    
   //als we in de eerste iteratie zitten en de 1e nieuwe CGroup is de eerste in de nieuwe sorted range
   else if (i === 0 && firstCGroupInSortedRange == true){
    addContactToRowAbove(rowPositionOfNewContact, cGroupDimensionsFound);
    rowGroupPositionsToAdd.push(rowPositionOfNewContact); 
    rowPositionOfNewContact = rowPositionOfNewContact + 1;    
   }
   //For the rest of the iterations, we add the new CGroups underneath the, already unique, newly created CGroup.
   //To create new row groups, we therefore add a grouped range with shiftdepth one after we've added the new contact
   else {
    addContactToRowBelow(rowPositionOfNewContact, cGroupDimensionsFound);
    groupRowRange(rowPositionOfNewContact +1, 1, 1);
    rowGroupPositionsToAdd.push(rowPositionOfNewContact);     
    rowPositionOfNewContact = rowPositionOfNewContact + 1;
      }
    }
  }
}

function getCredentialsOfFormObject(formObject, cacheOrNot){  
  var fullContactCredentials = ([
                formObject.cGroup_1,  
                formObject.cGroup_2,
                formObject.cGroup_3,
                formObject.cGroup_4, 
                formObject.last_name,
                formObject.first_name,                
                formObject.phone_number,
                formObject.email                 
                ]);

  //Put the phone number in between "" to ensure that the spreadsheet keep the original layout of the input
  if (fullContactCredentials[6]){
  fullContactCredentials[6] = "'" + fullContactCredentials[6];
  }
  

 // const fullContactCredentials = Object.values(formObject);
  if (cacheOrNot){
  cacheFullContactCredentials(fullContactCredentials); 
  }
  return fullContactCredentials;
}


//This function gets called by the user response on the modal with two button: create new Cgroup  vs alter input Cgroups
function cGroupNotFoundModalDialog(buttonid){
  if (buttonid == "create-new-cGroups"){
    //It's working now !! SO what do we do now ?
    createNewContactGroups();
  }
  else if (buttonid =="alter-input-Cgoups"){
    alterinputCGroups();
  }
}

  // Given the starting row of a grouped range, find it's properties
  // Note that with this function, we do use the fact that it's a grouped range in order to find its properties
  // Return: groupdepth, GroupLength
function propertiesGroupedRange(startIndexGroupedRow) {             
  // Get the groupDepth
  var groupedRangeDepth = sheet.getRowGroupDepth(startIndexGroupedRow);
  Logger.log("grouped range depth is " + groupedRangeDepth);
  // Get the entire rowgroup
  var groupedRange = sheet.getRowGroup(startIndexGroupedRow,groupedRangeDepth);
  Logger.log("Grouped range is " + groupedRange)
  //Get the range of the rowgroup
  var rangeOfGroupedRange = groupedRange.getRange();
  Logger.log("range of grouped range is " + rangeOfGroupedRange)
  //Get the length (=numrows) of the rowgroup       
  return [groupedRangeDepth, rangeOfGroupedRange];
}    
  
function findRangeOfInterestProperties(rangeOfInterest){
  var startRowOfROI = rangeOfInterest.getRow();
  Logger.log("Range of interest starts at " + startRowOfROI);
  // and more properties 
  var numRowsOfRoI = rangeOfInterest.getNumRows();  
  Logger.log("Number of rows in ROI is equal to" +  numRowsOfRoI);

  var valuesOfROI = rangeOfInterest.getValues();
  var propertiesROI = [startRowOfROI, numRowsOfRoI, valuesOfROI];
  return propertiesROI;
  }



function propertiesOfRowGroup(nameOfRange){

  // var nameOfRange = "NRC";
  var rangeOfInterest = findRangeOfInterest(nameOfRange);
  var propertiesROG = findRangeOfInterestProperties(rangeOfInterest);
  var startRowOfROG = propertiesROG[0];
  Logger.log("Starting row of Row group is " + startRowOfROG);
  var startIndexOfROG = parseInt(startRowOfROG) + 1;
  Logger.log("Index of row group is " + startIndexOfROG);
  var numRowsOfROG = propertiesROG[1];
  Logger.log("num Rows of Row group is " + numRowsOfROG);
  var valuesOfROG = propertiesROG[2];
  Logger.log("Values of Row group is " + valuesOfROG);
  var rowGroupDepth = sheet.getRowGroupDepth(startIndexOfROG);
  Logger.log("Depth of Row Group is " + rowGroupDepth);
  var rowGroupDefinition = sheet.getRowGroup(startIndexOfROG,rowGroupDepth);
  Logger.log("Row group definition is " + rowGroupDefinition);

  var rowGroupProperties = [startRowOfROG, startIndexOfROG, numRowsOfROG, valuesOfROG, rowGroupDepth, rowGroupDefinition];
  return rowGroupProperties;
}



//Note: now you just remove the rowgroup only !!!
function removeRowGroup(nameOfRange, rowGroupDepth){

  var nameOfRange = "NRC"   
  var propertiesROG = propertiesOfRowGroup(nameOfRange);
  var rowGroup = propertiesROG[5];
  Logger.log("We are gonna remove rowgroup " + rowGroup);    
  }

function expandRowGroup(nameOfRange){
  var propertiesROG = propertiesOfRowGroup(nameOfRange);
  var rowGroup = propertiesROG[5];
  Logger.log("We are gonna remove rowgroup " + rowGroup);   

  var startRowOfROI = propertiesROI[0];
  var numRowsOfRoI = propertiesROI[1];
  // expand the given ROWGROUP here
  }

function moveROItoNewPosition(nameOfRange){
  var rangeOfInterest = findRangeOfInterest(nameOfRange);    
  var propertiesROI = findRangeOfInterestProperties(rangeOfInterest);
  var valuesOfROI = propertiesROI[2];
  // Delete old ROI
  // Create ROI on new Position
  }





// Get tags from sheet to use in the autosuggestion of the contact creds form
function getAvailableTags(tagColumn) {
  var data = sheet.getDataRange().getValues();
  var headers = 2; // number of header rows to skip at top
  // ; // column # (0-based) containing tag

  var availableTags = [];

  for (var row=headers; row < data.length; row++) {
    availableTags.push(data[row][tagColumn]);
  }

  return(availableTags);
}

//INCLUDE HTML PARTS, EG. JAVASCRIPT, CSS, OTHER HTML FILES
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

//OPEN THE FORM IN SIDEBAR 
function createSideBar(sideBarForm, sideBarTitle) {      
  var form = HtmlService.createTemplateFromFile(sideBarForm.toString()).evaluate().setTitle(sideBarTitle.toString());
  SpreadsheetApp.getUi().showSidebar(form);
}

// Create the template for the modal dialog form; in this way we can add the inner HTML before showing it
function createModalDialog(dialogFormHTMLTitle) {  
  var form = HtmlService.createTemplateFromFile(dialogFormHTMLTitle.toString()); 
  return form;
}

//Evaluate and show the modal dialog form
function setModalDialog(dialogForm, dialogTitle) {
  var form = dialogForm.evaluate();
  SpreadsheetApp.getUi().showModelessDialog(form, dialogTitle.toString());
}

function guiAlterContactGroups() {

  //Submenu 1: add a new contact group
  // NOTE: this only means the contact group is    added to the spreadsheet self, NOT to the Google contacts  (this only happens when updating contacts)
   var subMenuCreateContactGroup = ui.createMenu("Add a contact group")
     .addItem("Create new contact group", 'newContactGroupPrompt')


     ui.createMenu('Alter contact groups')
       //Reference submenu
     .addSubMenu(subMenuCreateContactGroup)
     //  .addSeparator()
     //  .addSubMenu(subMenuclear)  // Call submenu for updaten here
     .addToUi()
}

function gUIimportcontacts() {
  //Declaring submenus:
  //Submenu 1: import all contacts
   var subMenuImportContacts = ui.createMenu("Update Google contacts")
    .addItem("Import all contacts to Google Contacts", 'importContacts')
      // Submenu 2: update contacts (so delete the deleted, update the updates and add new contacts

      //Function yet to be created !

    ui.createMenu('Import contacts')
    //Reference submenu
    .addSubMenu(subMenuImportContacts)
  //  .addSeparator()
  //  .addSubMenu(subMenuclear)  // Call submenu for updaten here
    .addToUi()
}

//creeer totaal menu en zet de submenu's er in
function setAllGUIs() {
   guiDialog()
   gUIimportcontacts()
}

function guiDialog() {

 //Submenu 1: add a new contact group
 // NOTE: this only means the contact group is    added to the spreadsheet self, NOT to the Google contacts  (this only happens when updating contacts)
  var subMenuShowDialogSidebar = ui.createMenu("Add contact")
    .addItem("Add new contact", 'getContactInputForm')
    ui.createMenu('Contacts')
      //Reference submenu
    .addSubMenu(subMenuShowDialogSidebar)
    //  .addSeparator()
    //  .addSubMenu(subMenuclear)  // Call submenu for updaten here
    .addToUi()
}

function onOpen(e) {

  setAllGUIs()

}

// Try to use this function as base for the getting of the contact credentials
function getContactInputForm(){
  var contactInputForm = createSideBar("Index-add-contact.html", "Contact Details");
}
