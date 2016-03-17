


function metaSnapshotHandler(instance) {
    var prefix = "meta-snapshot-";

    // Add the snapNum if it's available
    if(typeof instance.snapNum === "number") {
        prefix += instance.snapNum+"-";
    }

    return prefix;
}


module.exports = {
    "metaSnapshot" : metaSnapshotHandler
};