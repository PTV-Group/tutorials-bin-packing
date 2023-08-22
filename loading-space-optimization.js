
/**
 * This file contains the main application logic and state.
 * All API requests regarding PTVs loading space optimization happen here.
 */

const api_key = "YOUR_API_KEY";
const APIEndpoints = {
    StartBinPacking: "https://api.myptv.com/binpacking/v1/bins/async",
    GetStatus: (binpackingId) => `https://api.myptv.com/binpacking/v1/bins/status/${binpackingId}`,
    GetPackedBins: (binpackingId) => `https://api.myptv.com/binpacking/v1/bins/${binpackingId}`
};

const applyHeaders = (configuration) => ({
     ...configuration,
     headers: {
        "apiKey": api_key,
        ...configuration ? { ...configuration.headers } : {}
    }
});

/**
 * This object represents the application state
 */
const appState = {
    bins: [],
    items: [],
    optimizedResult: {request: undefined, response: undefined},
    selectedBinIndex: 0
};

/**
 * Applications entry point, triggered by "window.onload" event
 */
const initializeApplication = () => {

    getElement("btn-add-bin").addEventListener("click", addBin);
    getElement("btn-add-item").addEventListener("click", addItem);
    
    getElement("btn-start-optimization").addEventListener("click", optimize);

    getElement("previous-bin").addEventListener("click", () => switchSelectedBin(-1));
    getElement("next-bin").addEventListener("click", () => switchSelectedBin(1));
    
    getElement("close-error-details").addEventListener("click", () => hideElement("error-log"));
    getElement("clear-data").addEventListener("click", () => clearAllData());
    
    window.addEventListener('beforeunload', (e) => { e.preventDefault(); e.returnValue = ''; });
};

const createRequest = () => {
    return {
        items: appState.items,
        bins: appState.bins
    };
};

const startOptimization = (focus, requestBody) =>
    fetch(
        APIEndpoints.StartBinPacking + '?focus=' + focus,
        applyHeaders({
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        })
    ).then(response => response.ok ? response.json() : logError(response));

const getOptimizationProgress = (id) =>
    fetch(
        APIEndpoints.GetStatus(id),
        applyHeaders()
    ).then(response => response.ok ? response.json() : logError(response));

const getOptimizedResult = (id) =>
    fetch(
        APIEndpoints.GetPackedBins(id),
        applyHeaders()
    ).then(response => response.ok ? response.json() : logError(response));

const optimize = async () => {
    showElement("processing-indicator", "flex");

    let requestBody = createRequest();
    
    let focusCtrl = getElement("focus");
    let focus = focusCtrl.options[focusCtrl.selectedIndex].value;

    const startSuccessful = await startOptimization(focus, requestBody);
    if (!startSuccessful) return;

    const interval = setInterval( async () => {
        const progress = await getOptimizationProgress(startSuccessful.id);
        if (!progress) return clearInterval(interval);

        if (progress.status === "SUCCEEDED" || progress.status === "FAILED") {
            clearInterval(interval);
            const optimizedResult = await getOptimizedResult(startSuccessful.id);
            if (!optimizedResult) return;
            
            appState.optimizedResult.request = requestBody;
            appState.optimizedResult.response = optimizedResult;
            
            handleResponse($("#binViewer"), appState.optimizedResult.request, appState.optimizedResult.response);
            populateBinDetails();
            populateKPIs();
            showElement("optimization-results", "flex");
            hideElement("processing-indicator");
        }
    }, 500);
};

const addBin = () => {
    const { items, bins } = appState;
    let bin = {
        'id': 'B#' + bins.length,
        'numberOfInstances': parseInt(getElement("bin-number").value),
        'dimensions': {
            'x': parseInt(getElement("bin-dimension-x").value),
            'y': parseInt(getElement("bin-dimension-y").value),
            'z': parseInt(getElement("bin-dimension-z").value)
        },
        'maximumWeightCapacity': parseInt(getElement("bin-capacity").value) * 1000
    };
    
    bins.push(bin);
    updateOverviewTable(
        "bins-overview",
        bin.id,
        bin.dimensions,
        bin.maximumWeightCapacity,
        bin.numberOfInstances);

    if (items.length && bins.length) {
        enableElement(["btn-start-optimization"]);
    }
};

const addItem = () => {
    const { items, bins } = appState;
    let item = {
        'id': 'I#' + items.length,
        'numberOfInstances': parseInt(getElement("item-number").value),
        'dimensions': {
            'x': parseInt(getElement("item-dimension-x").value),
            'y': parseInt(getElement("item-dimension-y").value),
            'z': parseInt(getElement("item-dimension-z").value)
        },
        'weight': parseInt(getElement("item-weight").value) * 1000
    };
    
    items.push(item);
    updateOverviewTable(
        "items-overview",
        item.id,
        item.dimensions,
        item.weight,
        item.numberOfInstances);

    if (items.length && bins.length) {
        enableElement(["btn-start-optimization"]);
    }
};

const updateOverviewTable = (tableId, id, dimensions, weight, count) => {
    const tbody = getElement(tableId).getElementsByTagName("tbody")[0];
    const row = tbody.insertRow();
    row.insertCell(0).innerText = id;
    row.insertCell(1).innerText = dimensions.x + ',' + dimensions.y + ',' + dimensions.z;
    row.insertCell(2).innerText = weight / 1000; //in kg
    row.insertCell(3).innerText = count;
};

const clearAllData = () => {
    appState.bins = [];
    appState.items = [];
    appState.optimizedResult = {request: undefined, response: undefined};
    appState.selectedBinIndex = 0;  
    
    handleResponse($("#binViewer"), undefined, undefined);

    hideElement("optimization-results");
    disableElement(["btn-start-optimization"]);
    
    // --- Reset form to default values ---
    
    // Bin
    getElement("bin-dimension-x").value = 240;
    getElement("bin-dimension-y").value = 244;
    getElement("bin-dimension-z").value = 1360;
    getElement("bin-capacity").value = 20000;
    getElement("bin-number").value = 1;
    removeAllChildNodes(getElement("bins-overview").getElementsByTagName("tbody")[0]);

    // Item
    getElement("item-dimension-x").value = 80;
    getElement("item-dimension-y").value = 104;
    getElement("item-dimension-z").value = 120;
    getElement("item-weight").value = 500;
    getElement("item-number").value = 10;
    removeAllChildNodes(getElement("items-overview").getElementsByTagName("tbody")[0]);
    
    getElement("focus").selectedIndex = 1;
    
    enableElement(["btn-add-bin", "btn-add-item"]);
};

const switchSelectedBin = (step) => {
    const { selectedBinIndex } = appState;
    const usedBins = appState.optimizedResult.response.packedBins.length;

    let newIndex = selectedBinIndex + step;
    if (newIndex < 0) newIndex = usedBins - 1;
    if (newIndex > usedBins - 1) newIndex = 0;

    appState.selectedBinIndex = newIndex;
    changeBinView(newIndex);
    populateBinDetails();
};

const populateBinDetails = () => {
    const response = appState.optimizedResult.response;
    const selectedBin = response.packedBins[appState.selectedBinIndex];
    
    getElement("bin-index"           ).innerText = 'index: ' + appState.selectedBinIndex;
    getElement("bin-id"              ).innerText = selectedBin ? selectedBin.binId : '-';
    getElement("total-items-count"   ).innerText = selectedBin ? selectedBin.packedItems.length : '-';
    getElement("total-items-volume"  ).innerText = selectedBin ? (selectedBin.totalItemsVolume / 100 / 100 / 100).toFixed(3) + ' \u33A5' : '-';
    getElement("total-items-weight"  ).innerText = selectedBin ? selectedBin.totalItemsWeight/1000 + ' kg' : "-";
    getElement("used-weight-capacity").innerText = selectedBin ? selectedBin.usedWeightCapacity.toFixed(2) + ' %' : "-";
    getElement("used-volume-capacity").innerText = selectedBin ? selectedBin.usedVolumeCapacity.toFixed(2) + ' %' : "-";
    getElement("loading-meters"      ).innerText = selectedBin ? selectedBin.loadingMeters.toFixed(2) + ' m' : "-";    
};

const populateKPIs = () => {
    const { request, response } = appState.optimizedResult;

    const totalAvailableBins = request.bins.reduce((sum, bin) => sum + bin.numberOfInstances, 0);
    const totalAvailableItems = request.items.reduce((sum, item) => sum + item.numberOfInstances, 0);

    const totalUsedBins = response.packedBins.length;
    const totalUnpackedItems = response.itemsNotPacked.reduce((sum, item) => sum + item.numberOfInstances, 0);

    getElement("used-bins").innerText = totalUsedBins;
    getElement("unused-bins").innerText = totalAvailableBins - totalUsedBins;
    getElement("packed-items").innerText = totalAvailableItems - totalUnpackedItems;
    getElement("unpacked-items").innerText = totalUnpackedItems;
};

const logError = async (response) => {
    const errorDetails = await response.json();
    getElement("error-details").innerHTML = JSON.stringify(errorDetails, null, 2);
    showElement("error-log");
    hideElement("processing-indicator");
    return false;
};

window.onload = initializeApplication;