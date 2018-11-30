var initCode={"class": "go.GraphLinksModel",
"linkFromPortIdProperty": "fromPort",
"linkToPortIdProperty": "toPort",
"nodeDataArray": [
],
"linkDataArray": [
]};
window.onload=function(){      
      init()
}

function init() {
    if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
    var objGo = go.GraphObject.make;  // for conciseness in defining templates

    myDiagram =
      objGo(go.Diagram, "myDiagramDiv",  // must name or refer to the DIV HTML element
        {
          grid: objGo(go.Panel, "Grid",
                  objGo(go.Shape, "LineH", { stroke: "lightgray", strokeWidth: 0.5 }),
                  objGo(go.Shape, "LineH", { stroke: "gray", strokeWidth: 0.5, interval: 10 }),
                  objGo(go.Shape, "LineV", { stroke: "lightgray", strokeWidth: 0.5 }),
                  objGo(go.Shape, "LineV", { stroke: "gray", strokeWidth: 0.5, interval: 10 })
                ),
          allowDrop: true,  // must be true to accept drops from the Palette
          "draggingTool.dragsLink": true,
          "draggingTool.isGridSnapEnabled": true,
          "linkingTool.isUnconnectedLinkValid":true,
          "linkingTool.portGravity":20,
          "relinkingTool.isUnconnectedLinkValid": true,
          "relinkingTool.portGravity":20,
          "relinkingTool.fromHandleArchetype":
            objGo(go.Shape, "Diamond", { segmentIndex: 0, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "tomato", stroke: "darkred" }),
          "relinkingTool.toHandleArchetype":
            objGo(go.Shape, "Diamond", { segmentIndex: -1, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "darkred", stroke: "tomato" }),
          "linkReshapingTool.handleArchetype":
            objGo(go.Shape, "Diamond", { desiredSize: new go.Size(7, 7), fill: "lightblue", stroke: "deepskyblue" }),
          rotatingTool: objGo(TopRotatingTool),  // defined below
          "rotatingTool.snapAngleMultiple": 15,
          "rotatingTool.snapAngleEpsilon": 15,
          "undoManager.isEnabled": true
        });

    // when the document is modified, add a "*" to the title and enable the "Save" button
    myDiagram.addDiagramListener("Modified", function(e) {
      var button = document.getElementById("SaveButton");
      if (button) button.disabled = !myDiagram.isModified;
      var idx = document.title.indexOf("*");
      if (myDiagram.isModified) {
        if (idx < 0) document.title += "*";
      } else {
        if (idx >= 0) document.title = document.title.substr(0, idx);
      }
    });

    // Define a function for creating a "port" that is normally transparent.
    // The "name" is used as the GraphObject.portId, the "spot" is used to control how links connect
    // and where the port is positioned on the node, and the boolean "output" and "input" arguments
    // control whether the user can draw links from or to the port.
    function makePort(name, spot, output, input) {
      // the port is basically just a small transparent square
      return objGo(go.Shape, "Circle",
               {
                  fill: null,  // not seen, by default; set to a translucent gray by showSmallPorts, defined below
                  stroke: null,
                  desiredSize: new go.Size(7, 7),
                  alignment: spot,  // align the port on the main Shape
                  alignmentFocus: spot,  // just inside the Shape
                  portId: name,  // declare this object to be a "port"
                  fromSpot: spot, toSpot: spot,  // declare where links may connect at this port
                  fromLinkable: output, toLinkable: input,  // declare whether the user may draw links to/from here
                  cursor: "pointer"  // show a different cursor to indicate potential link point
               });
    }

    var nodeSelectionAdornmentTemplate =
      objGo(go.Adornment, "Auto",
        objGo(go.Shape, { fill: null, stroke: "deepskyblue", strokeWidth: 1.5, strokeDashArray: [4, 2] }),
        objGo(go.Placeholder)
      );

    var nodeResizeAdornmentTemplate =
      objGo(go.Adornment, "Spot",
        { locationSpot: go.Spot.Right },
        objGo(go.Placeholder),
        objGo(go.Shape, { alignment: go.Spot.TopLeft, cursor: "nw-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),
        objGo(go.Shape, { alignment: go.Spot.Top, cursor: "n-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),
        objGo(go.Shape, { alignment: go.Spot.TopRight, cursor: "ne-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),

        objGo(go.Shape, { alignment: go.Spot.Left, cursor: "w-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),
        objGo(go.Shape, { alignment: go.Spot.Right, cursor: "e-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),

        objGo(go.Shape, { alignment: go.Spot.BottomLeft, cursor: "se-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),
        objGo(go.Shape, { alignment: go.Spot.Bottom, cursor: "s-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" }),
        objGo(go.Shape, { alignment: go.Spot.BottomRight, cursor: "sw-resize", desiredSize: new go.Size(6, 6), fill: "lightblue", stroke: "deepskyblue" })
      );

    var nodeRotateAdornmentTemplate =
      objGo(go.Adornment,
        { locationSpot: go.Spot.Center, locationObjectName: "CIRCLE" },
        objGo(go.Shape, "Circle", { name: "CIRCLE", cursor: "pointer", desiredSize: new go.Size(7, 7), fill: "lightblue", stroke: "deepskyblue" }),
        objGo(go.Shape, { geometryString: "M3.5 7 L3.5 30", isGeometryPositioned: true, stroke: "deepskyblue", strokeWidth: 1.5, strokeDashArray: [4, 2] })
      );

    myDiagram.nodeTemplate =
      objGo(go.Node, "Spot",
        { locationSpot: go.Spot.Center },
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        { selectable: true, selectionAdornmentTemplate: nodeSelectionAdornmentTemplate },
        { resizable: true, resizeObjectName: "PANEL", resizeAdornmentTemplate: nodeResizeAdornmentTemplate },
        { rotatable: true, rotateAdornmentTemplate: nodeRotateAdornmentTemplate },
        new go.Binding("angle").makeTwoWay(),
        // the main object is a Panel that surrounds a TextBlock with a Shape
        objGo(go.Panel, "Auto",
          { name: "PANEL" },
          new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
          objGo(go.Shape, "Rectangle",  // default figure
            {
              portId: "", // the default port: if no spot on link data, use closest side
              fromLinkable: true, toLinkable: true, cursor: "pointer",
              fill: "white",  // default color
              strokeWidth: 2
            },
            new go.Binding("figure"),
            new go.Binding("fill")),
          objGo(go.TextBlock,
            {
              font: "bold 11pt Helvetica, Arial, sans-serif",
              margin: 10,
              maxSize: new go.Size(160, NaN),
              wrap: go.TextBlock.WrapFit,
              editable: true,
              stroke:'#fff'
            },
            new go.Binding("text").makeTwoWay())
        ),
        // four small named ports, one on each side:
        makePort("T", go.Spot.Top, false, true),
        makePort("L", go.Spot.Left, true, true),
        makePort("R", go.Spot.Right, true, true),
        makePort("B", go.Spot.Bottom, true, false),
        { // handle mouse enter/leave events to show/hide the ports
          mouseEnter: function(e, node) { showSmallPorts(node, true); },
          mouseLeave: function(e, node) { showSmallPorts(node, false); }
        }
      );

    function showSmallPorts(node, show) {
      node.ports.each(function(port) {
        if (port.portId !== "") {  // don't change the default port, which is the big shape
          port.fill = show ? "rgba(0,0,0,.3)" : null;
        }
      });
    }

    var linkSelectionAdornmentTemplate =
      objGo(go.Adornment, "Link",
        objGo(go.Shape,
          // isPanelMain declares that this Shape shares the Link.geometry
          { isPanelMain: true, fill: null, stroke: "deepskyblue", strokeWidth: 0 })  // use selection object's strokeWidth
      );

    myDiagram.linkTemplate =
      objGo(go.Link,  // the whole link panel
        { selectable: true, selectionAdornmentTemplate: linkSelectionAdornmentTemplate },
        { relinkableFrom: true, relinkableTo: true, reshapable: true },
        {
          routing: go.Link.AvoidsNodes,
          curve: go.Link.JumpOver,
          corner: 5,
          toShortLength: 4
        },
        new go.Binding("points").makeTwoWay(),
        objGo(go.Shape,  // the link path shape
          { isPanelMain: true, strokeWidth: 2 }),
        objGo(go.Shape,  // the arrowhead
          { toArrow: "Standard", stroke: null }),
        objGo(go.Panel, "Auto",
          new go.Binding("visible", "Selected").ofObject(),
          objGo(go.Shape, "RoundedRectangle",  // the link shape
            { fill: "#FFF", stroke: null, }),
          objGo(go.TextBlock,
            {
              textAlign: "center",
              font: "10pt helvetica, arial, sans-serif",
              stroke: "#252525",
              margin: 2,
              text:'请输入判断符(Y/N)或者描述性文字',
              minSize: new go.Size(10, NaN),
              editable: true
            },
            new go.Binding("text").makeTwoWay())
        )
      );

    load();  // load an initial diagram from some JSON text

    // initialize the Palette that is on the left side of the page
    myPalette =
      objGo(go.Palette, "myPaletteDiv",  // must name or refer to the DIV HTML element
        {
          maxSelectionCount: 1,
          nodeTemplateMap: myDiagram.nodeTemplateMap,  // share the templates used by myDiagram
          linkTemplate: // simplify the link template, just in this Palette
            objGo(go.Link,
              { // because the GridLayout.alignment is Location and the nodes have locationSpot == Spot.Center,
                // to line up the Link in the same manner we have to pretend the Link has the same location spot
                locationSpot: go.Spot.Center,
                selectionAdornmentTemplate:
                  objGo(go.Adornment, "Link",
                    { locationSpot: go.Spot.Center },
                    objGo(go.Shape,
                      { isPanelMain: true, fill: null, stroke: "deepskyblue", strokeWidth: 0 }),
                    objGo(go.Shape,  // the arrowhead
                      { toArrow: "Standard", stroke: null })
                  )
              },
              {
                routing: go.Link.AvoidsNodes,
                curve: go.Link.JumpOver,
                corner: 5,
                toShortLength: 4
              },
              new go.Binding("points"),
              objGo(go.Shape,  // the link path shape
                { isPanelMain: true, strokeWidth: 2 }),
              objGo(go.Shape,  // the arrowhead
                { toArrow: "Standard", stroke: null })
            ),
          model: new go.GraphLinksModel(
          [  // specify the contents of the Palette
            { text: "开始", figure: "Circle", fill: "#009688",mean:'开始',key:createUUID()},
            { text: "结束", figure: "Circle", fill: "#FF5722",mean:'结束',key:createUUID()},
            { text: "判断符", figure: "Diamond", fill: "#1E9FFF",mean:'自定义',key:createUUID()},            
            { text: "内容", figure: "RoundedRectangle", fill: "#FFB800",mean:'内容',key:createUUID()}            
            // { text: "DB", figure: "Database", fill: "lightgray" },
          ],[
            // the Palette also has a disconnected Link, which the user can drag-and-drop
            // { points: new go.List(go.Point).addAll([new go.Point(0, 0), new go.Point(30, 0), new go.Point(30, 40), new go.Point(60, 40)]) }
          ])
        });
      // 动态 dom
  myDiagram.addModelChangedListener(function(evt){
    // // ignore unimportant Transaction events
    if (!evt.isTransactionFinished) return;
    var txn = evt.object;  // a Transaction
    if (txn === null) return;
    // iterate over all of the actual ChangedEvents of the Transaction
    txn.changes.each(function(e) {
      // ignore any kind of change other than adding/removing a node
      if (e.modelChange !== "nodeDataArray") return;
      // record node insertions and removals
      if (e.change === go.ChangedEvent.Insert) {
        // e.newValue.key=createUUID();
      } else if (e.change === go.ChangedEvent.Remove) {
        // console.log(evt.propertyName + " removed node with key: " + e.oldValue.key);
      }
    });
  });
}
function TopRotatingTool() {
  go.RotatingTool.call(this);
}
go.Diagram.inherit(TopRotatingTool, go.RotatingTool);

  /** @override */
TopRotatingTool.prototype.updateAdornments = function(part) {
  go.RotatingTool.prototype.updateAdornments.call(this, part);
  var adornment = part.findAdornment("Rotating");
  if (adornment !== null) {
    adornment.location = part.rotateObject.getDocumentPoint(new go.Spot(0.5, 0, 0, -30));  // above middle top
  }
};

  /** @override */
TopRotatingTool.prototype.rotate = function(newangle) {
  go.RotatingTool.prototype.rotate.call(this, newangle + 90);
};
  // end of TopRotatingTool class


// Show the diagram's model in JSON format that the user may edit
function save(){
  saveDiagramProperties();  // do this first, before writing to JSON
  initCode=null;
  var key_one=false,key_two=false;
  for(arr in myDiagram.model.nodeDataArray){
    if(myDiagram.model.nodeDataArray[arr].mean==='开始'){
      key_one=true;
    }
    if(myDiagram.model.nodeDataArray[arr].mean==='结束'){
      key_two=true;
    }
  }
  if(key_one && key_two){
    initCode = myDiagram.model.toJson();
    /*缓存*/
    if(window.localStorage){
      var wLocal=window.localStorage;
        wLocal.saveModel=checkJson(myDiagram.model.toJson());
    }else{
      console.log('请使用高版本浏览器');
    }
    myDiagram.isModified = false;
  }else{
    alert('保存失败!开始按钮和结束按钮必须存在');
  }
}
function load(){  
  /*缓存*/
  if(window.localStorage){
      if(window.localStorage.saveModel){
        initCode=window.localStorage.saveModel;
      }
  }else{
    console.log('请使用高版本浏览器');
  }
  myDiagram.model = go.Model.fromJson(initCode);
  loadDiagramProperties();  // do this after the Model.modelData has been brought into memory
}

function saveDiagramProperties() {
  myDiagram.model.modelData.position = go.Point.stringify(myDiagram.position);
}
function loadDiagramProperties(e) {
  // set Diagram.initialPosition, not Diagram.position, to handle initialization side-effects
  var pos = myDiagram.model.modelData.position;
  if (pos) myDiagram.initialPosition = go.Point.parse(pos);
}
function createUUID(){
  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
   var uuid = [], i;
   var radix = 36;// 基数
   var len = 32;// 默认生成32位随机数
   radix = radix || chars.length;

   if (len) {
     for (i = 0; i < len; i++)
       uuid[i] = chars[0 | Math.random() * radix];
   } else {
     var r;
     uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
     uuid[14] = '4';
     for (i = 0; i < 36; i++) {
       if (!uuid[i]) {
         r = 0 | Math.random() * 16;
         uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
       }
     }
   }
   return uuid.join('');
}
function checkJson(json){
  var object=JSON.parse(json);
  for(link in object.linkDataArray){
    //for in问题
    if(typeof object.linkDataArray[link] != 'function'){
      object.linkDataArray[link].from=object.linkDataArray[link].from.substring(0,32);
      object.linkDataArray[link].to=object.linkDataArray[link].to.substring(0,32);
    }
  }
  //for in问题
  for(node in object.nodeDataArray){
    object.nodeDataArray[node].key=object.nodeDataArray[node].key.substring(0,32);    
  }
  return JSON.stringify(object);
}