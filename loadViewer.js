var dataView;

var mouse = {};
  document.onmousemove = function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
}
  
function defaultOptions () {
    return {
      width: $(".binpicture").width(),
      height: $(".bintable").height(),
      backgroundColor: 0x9E9E9E,
      cameraType: "perspective",
      horizontalRotation: true,
      verticalRotation: true,
      border: 40
    };
}
  
  function defaultColors () {
    return [
      "0xdf7126","0xd9a066","0xeec39a","0xfbf236",
      "0x99e550","0x6abe30","0x37946e","0x4b692f","0x524b24","0xe02f74","0x30a082",
      "0x639bff","0x5ffe4","0xcbfffc","0x9badb7","0x847eee","0x696aee",
      "0xee0000","0x76428a","0xac3232","0xd95763","0xd77bba","0x8f974a","0x8a6f30",
      "0x22f4f1","0x45283c","0x663931","0x8f563b"
    ];
}
  
function defaultMapping () {
    var colors = defaultColors();
    return {
      "x_start": ["x"],
      "y_start": ["y"],
      "z_start": ["z"],
      "x_length": ["width"],
      "y_length": ["height"],
      "z_length": ["depth"],
      "color": function (item) {
         return colors[item.nr % colors.length];
      }
    };
}
  
function binMapping () {
  var colors = defaultColors();
  return {
      "x_start": ["x"],
      "y_start": ["y"],
      "z_start": ["z"],
      "x_length": ["width"],
      "y_length": ["height"],
      "z_length": ["depth"],
      "color": "0xff0000"
    };
}

function changeBinView(idxBin) {
    createBinGraph(dataView[idxBin], $("#BinViewerDiv"));
}

function createBinGraph(data, div) {
    $("#pack").remove();
    $(div).append('<div id="pack" class="packwidget"></div>');

    var items = mapItems(data.items, defaultMapping());
    var bins = mapBins([data.bin], binMapping());
    var packwidget = new PackWidget(bins, items, defaultOptions());
    packwidget.onItemOver = function(item) { if (item) {highlightItem(item, "#F00"); tooltip(mouse.x, mouse.y , item.dataItem.label, item); } };
    packwidget.onItemOut = function(item) { if (item) { removeTooltip(item); unhighlightItem(item); } };
    packwidget.create($("#pack").get(0));
}

function createBinDiv(data, div) {
    clearViewer(div);
    dataView = data;
    changeBinView(0);  
}

// reset div for binViewers
function clearViewer(div) {
    $(div).empty();
    $(div).append('<div id="BinViewerDiv" class="binpicture"></div>');
}
