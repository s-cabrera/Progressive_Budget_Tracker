let db, budgetVersion;

// Step 1: Open the database
const request = indexedDB.open("budgetDB", budgetVersion || 21);
request.onupgradeneeded = function (event) {
    //Update the Version Number
    const { oldVersion } = event;
    const newVersion = event.newVersion || db.version;

    console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

    db = event.target.result;

    // If there are no 
    if (db.objectStoreNames.length === 0) {
        // const objectStore = 
        db.createObjectStore("budget", { autoIncrement: true });
    }
}

function checkDB() {
    //Open transaction on budget database
    let trans = db.transaction(["budget"], "readwrite");
    //access the budget
    let budgetStore = trans.objectStore("budget");
    // get all of the records from the budget
    const allTransactions = budgetStore.getAll();

    allTransactions.onsuccess = () => {
        //If there are records, add them to the MongoDB 
        if (allTransactions.result.length > 0) {
            for (let index = 0; index < allTransactions.result.length; index++) {
                fetch("/api/transaction", {
                    method: "POST",
                    body: JSON.stringify(allTransactions.result[index]),
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json"
                    }
                })
                    .then((response) => response.json())
                    .then((res) => {
                        //If the call was successful, clear the indexDB
                        if (res.length !== 0) {
                            trans = db.transaction(["budget"], "readwrite");
                            //access the budget
                            const store = trans.objectStore("budget");


                            // Clear existing entries because our bulk add was successful
                            store.clear();
                            console.log('Clearing store 🧹');
                        }
                    })

            }
        }
    }
}


request.onsuccess = function (event) {
    db = event.target.result;
    // Check if app is online before reading from db
    if (navigator.onLine) {
        console.log('Backend online! 🗄️');
        checkDB();
    }
}

//Stores the data (transaction) in IndexDB
const saveRecord = (data) => {
    console.log('Saving Record');
    // Create a transaction on the BudgetStore db with readwrite access
    const trans = db.transaction(["budget"], "readwrite");
    const objectStore = trans.objectStore("budget")
    objectStore.add(data)
};

// Listen for app coming back online
window.addEventListener('online', checkDB);