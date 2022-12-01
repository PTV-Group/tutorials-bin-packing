function handleResponse(divID, request, response) {
    if (!response) {
        clearViewer(divID);
        return;
    }
     
    const data = convertToViewer(request, response);
    if (data.length > 0) {
        createBinDiv(data, divID);
    }
}

function searchItemIndex(request, id) {
    for (let i in request.items) {
        if (request.items[i].id == id) return i;
    }
    return 0;
}

function searchBin(request, id) {
    for (let b of request.bins) {
        if (b.id == id) return b;
    }
    return null;
}

function convertToViewer(request, response) {
    let data = [];
    if (response.packedBins != null) {
        for (let b of response.packedBins) {
            if (b.packedItems.length > 0) {
                let requestBin = searchBin(request, b.binId);
                if (requestBin != null) {
                    let instance = {};
                    
                    let bin = {};
                    bin.label = b.binId;
                    bin.x = 0;
                    bin.y = 0;
                    bin.z = 0;
                    bin.width = requestBin.dimensions.x;
                    bin.height = requestBin.dimensions.y;
                    bin.depth = requestBin.dimensions.z;
                    instance.bin = bin;
                                        
                    let items = [];
                    for (let i of b.packedItems) {
                        let item = {};
                        item.label = i.itemId;
                        item.nr = searchItemIndex(request, i.itemId);
                        item.x = i.position.x;
                        item.y = i.position.y;
                        item.z = i.position.z;
                        item.width = i.dimensions.x;
                        item.height = i.dimensions.y;
                        item.depth = i.dimensions.z;
                        items.push(item);
                    }
                    instance.items = items;

                    data.push(instance);
                }
            }
        }
    }
    return data;
}