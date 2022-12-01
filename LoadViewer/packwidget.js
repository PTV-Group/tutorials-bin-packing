/**
 * Returns the position of an object with respect to the
 * (0, 0, 0) coordinate of the object.
 * @method positionWithPivot
 * @param x x coordinate of the object
 * @param y y coordinate of the object
 * @param z z coordinate of the object
 * @param width width of the object
 * @param height height of the object
 * @param depth depth of the object
 * @return new position
 **/
function positionWithPivot(x, y, z, width, height, depth) {
  var newPosition = {
    x: x + width/2.0,
    y: y + height/2.0,
    z: z + depth/2.0
  };
  return newPosition;
}

/**
 * Returns the camera distance needed to fit an object to the screen
 * @method fitObjToScreen
 * @param fov Field of view of the camera
 * @param aspect aspect ratio of the camera
 * @param objWidth The width ob the object
 * @param border left and right border in percent
 * @return distance of camera
 */
function fitObjToScreen(fov, aspect, objWidth, border) {
    var width = objWidth + (objWidth/100.0)*border*2;
    var distance = width/(2*aspect*Math.tan(((Math.PI*fov)/360)));
    return distance;
}

/**
 * Returns the total dimensions of multiple bins
 * @method totalSize
 * @param bins array with bin objects
 * @return size object with x, y, z dimensions and center
 */
function totalSize(bins) {
  var size = {};
  var xCoordinates = [];
  var yCoordinates = [];
  var zCoordinates = [];
  bins.forEach(function (bin) {
    xCoordinates.push(parseFloat(bin.x));
    yCoordinates.push(parseFloat(bin.y));
    zCoordinates.push(parseFloat(bin.z));
  });
  size.x = Math.max.apply(Math, xCoordinates);
  size.x += parseFloat(bins[xCoordinates.indexOf(size.x)].width);
  size.y = Math.max.apply(Math, yCoordinates);
  size.y += parseFloat(bins[yCoordinates.indexOf(size.y)].height);
  size.z = Math.max.apply(Math, zCoordinates);
  size.z += parseFloat(bins[zCoordinates.indexOf(size.z)].depth);
  size.center = {};
  size.center.x = size.x/2;
  size.center.y = size.y/2;
  size.center.z = size.z/2;
  return size;
}

/**
 * Calculate the initial position of the camera based on the given options
 * @method initialPosition
 * @param options
 * @param bins Array of Bin objects
 * @return position of camera
 */
function initialPosition(options, bins) {
  options.rotateY = true;
  var camera = new THREE.PerspectiveCamera(
    options.fov, options.width/options.height, 0.1, 10000);
  var distance = 0;
  var position = {};
  var size = totalSize(bins);
  var minLength = Math.min(size.x, size.z);
  var maxLength = Math.max(size.x, size.z);
  var ratio = maxLength/minLength;
  if (ratio < 2) {
      options.rotateY = true;
      if(size.x > size.z) {
          var diag = size.z * Math.sqrt(2);
          distance = fitObjToScreen(options.fov, options.width/options.height, diag, options.border);

          camera.position.x =  size.center.x;
          camera.position.z =  size.center.z + diag/2;
          camera.position.y = size.center.y + size.y/2;
          camera.lookAt(size.center);
          camera.translateZ(distance);
      } else {
          var diag = size.x * Math.sqrt(2);
          distance = fitObjToScreen(options.fov, options.width/options.height, diag, options.border);

          camera.position.x =  - size.center.x + diag/2;
          camera.position.z =   size.center.z;
          camera.position.y = size.center.y ;
          camera.lookAt(size.center);
          camera.translateZ(distance);
      }
  } else {
      if(size.x > size.z) {
          distance = fitObjToScreen(options.fov, options.width/options.height, size.x, options.border);

          camera.position.x =  size.center.x;
          camera.position.z =   size.center.z + size.z/2;
          camera.position.y = size.center.y + size.y/2;
          camera.lookAt(size.center);
          camera.translateZ(distance);
      } else {
          distance = fitObjToScreen(options.fov, options.width/options.height, size.z, options.border);

          camera.position.x =  - size.center.x + size.x/2;
          camera.position.z =  size.center.z;
          camera.position.y = size.center.y ;
          camera.lookAt(size.center);
          camera.translateZ(distance);
      }
  }

  position = camera.position;
  position.center = size.center;
  return position;
}

/**
 * Creates a new item to be used with PackWidget
 * @method Item
 * @param x x coordinate of the item
 * @param y y coordinate of the item
 * @param z z coordinate of the item
 * @param width width of the item
 * @param height height of the item
 * @param depth depth of the item
 * @param holds the data from which the item was created, optional
 */
var Item = function(x, y, z, width, height, depth, color, dataItem) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.width = width;
  this.height = height;
  this.depth = depth;
  this.color = color;
  this.dataItem = dataItem;
  this.visible = true;
  this.data = dataItem;
  this.graphicsItem = 0;
  this.toString = function () {
      return "Position: " + this.x + " " + this.y + " " + this.z +
          "Dimensions: " + this.width + " "
          + this.height + " " + this.depth;
  };
};

/**
 * Creates a new box shaped Bin.
 * @param x x position of the bin
 * @param y y position of the bin
 * @param z z position of the bin
 * @param width width of the bin
 * @param height height of the bin
 * @param depth depth of the bin
 * @param color color of the bin in hex format
 */
var Bin = function (x, y, z, width, height, depth, color) {
  return new BinShaped(x, y, z, dimensionsToPath(width, height), depth, color);
};

function BinShaped(x, y, z, shape, depth, color) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.color = color;
    this.shape = shape;
    this.width = Math.max.apply(null, shape.map(function(point) {
        return point.x;
    }));
    this.height = Math.max.apply(null, shape.map(function(point) {
        return point.y;
    }));
    this.depth = depth;
    this.visible = true; 
}

/** Creates a camera to be used with PackWidget
 * @method Camera
 * @param position position of the camera
 * @param target target the camera looks at
 */
var Camera = function(position, target) {
  this.position = position;
  this.target = target;
  this.toString = function() {
      return "Position: " + position +
             "Target:" + target;
  };
};

/** Creates the Widget object which is shown on the page
 * After initialization create() must be called to actually
 * show it.
 * @method PackWidget
 * @param bins bin objects
 * @param items items of the scene
 * @param userOptions options provided by the user
 */
var PackWidget = function (bins, items, userOptions) {
  this.mouse = new THREE.Vector2();
  // this is a hack: serialize/deserialize userOptions to clone objects
  this.userOptions = JSON.parse(JSON.stringify(userOptions));
  this.bins = JSON.parse(JSON.stringify(bins));
  this.items = JSON.parse(JSON.stringify(items));
  this.itemMap = new Map();
  this.onItemClick = function(item) {};
  this.onItemOver = function(item) {};
  this.onItemOut = function(item) {};
}


/** Creates sane default options
 * @method createDefaultOptions
 * @param bin the bin object which is used for determining the camera position
 */
PackWidget.prototype.createDefaultOptions = function (bins) {
  var defaultOptions = {
    backgroundColor: 0xfffffff,
    width: 640,
    fov: 30,
    border: 0,
    height: 640,
    //cameraPosition: {x: bin.height * 2, y: bin.height * 2, z: bin.height * 2},
    //cameranTarget: {x: bin.width/2, y: bin.height/2, z: bin.depth/2},
    cameraType: "perspective",
    highlightColor: 0xff0000
  };
  return defaultOptions;
};

/** Creates a rect shaped path based on width and height
 * @param width width of the path
 * @param height height of the path
 * @return path
 */
function dimensionsToPath(width, height) {
return [{x: 0, y: 0}, {x: 0, y:height}, {x: width, y: height}, {x: width, y: 0}];
}

/** Creates the final options based on the default options and the user
 * options.
 * @method createOptions
 * @param defaultOptions the default options
 * @param userOptions the user options
 * @return the final options
 */
PackWidget.prototype.createOptions = function (bins, defaultOptions, userOptions) {
  var options = defaultOptions;
  for (opt in userOptions) {
    options[opt] = userOptions[opt];
  }
  var pos = initialPosition(options, bins);
  options.cameraPosition = pos;
  options.cameraTarget = pos.center;
  return options;
};

/**
 * Creates the camera object for the THREE scene. Not meant to be
 * called by the user.
 * @param options options created by createOptions
 * @return THREE camera object
 */
PackWidget.prototype.createThreeCamera = function(options, bins) {
  var camera;
  if (options.cameraType == "perspective") {
    camera = new THREE.PerspectiveCamera(
      this.options.fov, this.options.width/this.options.height, 0.1, 10000);
      camera.position.x = options.cameraPosition.x;
      camera.position.y = options.cameraPosition.y;
      camera.position.z = options.cameraPosition.z;
  }
  else if (options.cameraType == "orthographic") {
    camera = new THREE.OrthographicCamera(this.options.width/-2,
                this.options.width/2, this.options.height/2,
                this.options.height/-2, 0.1, 10000);
                camera.position.x = options.cameraPosition.x;
                camera.position.y = options.cameraPosition.y;
                camera.position.z = options.cameraPosition.z;
    camera.zoom = 0.5;
    camera.updateProjectionMatrix();
  }
  camera.lookAt(options.cameraTarget.x,
                options.cameraTarget.y,
                options.cameraTarget.z);
 // camera.lookAt(100, 1000, 100);
  camera.updateProjectionMatrix();

  return camera;
};

/**
 * Creates lights for the THREE scene
 * @method createThreeLights
 * @param options created by createOptions
 * @return array with light objects
 */
PackWidget.prototype.createThreeLights = function(options) {
  var lights = [];
  var light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(0.8, 1, 0.7);
  lights.push(light);
  //light = new THREE.DirectionalLight(0xffffff, 1);
  //light.position.set(-0.8, 1, -0.7);
  //lights.push(light);
  return lights;
};

/** Creates a graphics object for a shaped bin
 * @param bin
 * @return bin mesh
 **/
function createShapedTHREEBin(bin) {
    var shape = new THREE.Shape();
    for(var j = 0; j < bin.shape.length; j++) {
    shape.moveTo(bin.shape[j].x,
             bin.shape[j].y);       
    }

    var material = new THREE.MeshBasicMaterial({color: 0xff0000});
    
    var settings = { wireframe: true, amount: bin.depth,
             bevelEnabled: false, bevelSegments: 1,
             steps: 1, bevelSize: 1, bevelThickness: 1 };
    var geometry = new THREE.ExtrudeGeometry(shape, settings);
    var mesh = new THREE.Mesh(geometry, material);
  

    edges = new THREE.EdgesHelper( mesh, bin.color);
    edges.matrixAutoUpdate = true;

    pos = positionWithPivot(bin.x, bin.y, bin.z,
                bin.width, bin.height, bin.depth);
    edges.position.x = pos.x;
    edges.position.y = pos.y;
    edges.position.z = pos.z;

    bin.graphicsItem = edges;

    return edges;
}

/** Create a non shaped, box like Bin Graphics Object
 * @param bin
 */
function createTHREEBin(bin) {
    var geometry = new THREE.BoxGeometry(
    bin.width,
    bin.height,
    bin.depth
    );

    var material = new THREE.MeshBasicMaterial({color: bin.color});
    var cube = new THREE.Mesh(geometry, material);

    pos = positionWithPivot(bin.x, bin.y, bin.z,
                            bin.width, bin.height, bin.depth);
    cube.position.x = pos.x;
    cube.position.y = pos.y;
    cube.position.z = pos.z;

    var helper = new THREE.BoxHelper(cube);
    helper.material.color.set(bin.color);
    
    bin.graphicsItem = helper;

    return helper;
}

/**
 * Creates a groundplane graphics object for a given bin.
 * @param bin 
 * @return mesh of the ground plane
 */
function createGroundPlane(bin) {
    var geometry = new THREE.BoxGeometry(bin.width, 5, bin.depth);
    var material = new THREE.MeshBasicMaterial( {color: 0xaaaaaa} );
    var cube = new THREE.Mesh( geometry, material );
   
	var pos = positionWithPivot(bin.x, bin.y - 5.01, bin.z, bin.width, 5, bin.depth);
    cube.position.x = pos.x;
	cube.position.y = pos.y;
	cube.position.z = pos.z;
    return cube;
}

/**
 * create Bin graphics Objects 
 */
PackWidget.prototype.createThreeBins = function (bins) {
    let binMeshs = [];
    const ground = Math.min.apply(null, bins.map(bin => bin.y));
    for(const i in bins) {
        binMeshs.push(createTHREEBin(bins[i]));
        if (bins[i].y === ground && this.userOptions.showGround) {
            binMeshs.push(createGroundPlane(bins[i]));
        }
    }
    return binMeshs;
};

/**
 * Creates the THREE graphics objects (meshes) representing the items for
 * usage with the THREE scene. Not meant to be called by the user.
 * @method createThreeItems
 * @param items to be represented
 * @return graphics objects
 */
PackWidget.prototype.createThreeItems = function(items) {
  var cubes = [];
  var edges = [];
  for (var i = 0; i < items.length; i++) {
    var geometry = new THREE.BoxGeometry(
      items[i].width,
      items[i].height,
      items[i].depth);
    var material = new THREE.MeshPhongMaterial({color:items[i].color});
    var cube = new THREE.Mesh(geometry, material);

    var pos = positionWithPivot(items[i].x, items[i].y, items[i].z,
                                items[i].width, items[i].height, items[i].depth);
    cube.position.x = pos.x;
    cube.position.y = pos.y;
    cube.position.z = pos.z;
    cubes.push(cube);
    items[i].graphicsItem = cube;
    this.itemMap.set(cube, items[i]);

    edge = new THREE.EdgesHelper(cube, 0x000000);
    edges.push(edge);
  }
  return cubes.concat(edges);
};

/**
 * Creates the renderer for THREE. Not meant to be called by the user.
 * @method createThreeRenderer
 * @param options options created by createOptions
 * @return THREE renderer
 */
PackWidget.prototype.createThreeRenderer = function(options) {
  var renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setClearColor(options.backgroundColor);
  renderer.setSize(this.options.width, this.options.height);
  return renderer;
};

/**
 * Created the THREE Scene of the given bins, items, camera and lights.
 * Not meant to be called by the user.
 * @method createThreeScene
 * @param bins THREE graphics objects representing the bins.
 * @param items THREE graphics objects representing the items.
 * @param camera THREE camera object
 * @param lights THREE light objects
 * @return THREE scene.
 */
PackWidget.prototype.createThreeScene = function(bins, items, camera, lights) {
  var scene = new THREE.Scene();
  for (var i = 0; i < bins.length; i++)
    scene.add(bins[i]);
  for (var i = 0; i < items.length; i++)
    scene.add(items[i]);
  scene.add(camera);
  for (var i = 0; i < lights.length; i++)
    scene.add(lights[i]);
  return scene;
};



/**
 * Creates the widget and appends it to the dom element.
 * @param container dom element
 */
PackWidget.prototype.create = function (container) {

  this.userOptions.width = container.offsetWidth;
  this.userOptions.height = container.offsetHeight;
  this.options = this.createOptions(this.bins,
  this.createDefaultOptions(this.bins), this.userOptions);
  
  var width = this.options.width;
  var height = this.options.height;
  var currentColor;
  var raycaster = new THREE.Raycaster();
  var rect = container.getBoundingClientRect();
  var mouse = new THREE.Vector2();
  var graphicsItems = this.createThreeItems(this.items);
  var graphicsBins = this.createThreeBins(this.bins);
  var camera = this.createThreeCamera(this.options, this.bins);

  var lights = this.createThreeLights();
  this.lights = lights;
  var scene = this.createThreeScene(graphicsBins, graphicsItems, camera, lights);
  scene.userData.element = container;
  scene.userData.camera = camera;
  scene.userData.lights = lights;
  this.scene = scene;
  scene.userData.itemMap = this.itemMap;

    // add Threex Event Handlers for items
  var domEvents = new THREEx.DomEvents(camera, scene.userData.element);

    var itemClicked = this.onItemClick;
    var itemOver = this.onItemOver;
    var itemOut = this.onItemOut;

    for (var i = 0; i < graphicsItems.length; i++) {
      domEvents.bind(graphicsItems[i], 'click', function(item) {
          itemClicked(scene.userData.itemMap.get(item.target));}, false);

      domEvents.bind(graphicsItems[i], 'mouseover', function(item) {
          itemOver(scene.userData.itemMap.get(item.target));}, false);

    itemOut = this.onItemOut;
      domEvents.bind(graphicsItems[i], 'mouseout', function(item) {
          itemOut(scene.userData.itemMap.get(item.target));}, false);
    }


  scene.userData.controls = new THREE.OrbitControls(scene.userData.camera, scene.userData.element);
  scene.userData.controls.target = this.options.cameraTarget;

	var angle;
  // if options.rotateY = true, look from a 45 degree angle
  if (this.options.rotateY === true) {
      angle = Math.PI/4;
      scene.userData.controls.minAzimuthAngle = angle;
      scene.userData.controls.maxAzimuthAngle = angle;
      scene.userData.controls.update();
      
      scene.userData.controls.minAzimuthAngle = -Math.PI;
      scene.userData.controls.maxAzimuthAngle = Math.PI;
      scene.userData.controls.update();
  }
  
  // camera looks down from a 45 degree angle
  angle = Math.PI/3;
  scene.userData.controls.minPolarAngle = angle;
  scene.userData.controls.maxPolarAngle = angle;
  scene.userData.controls.update();
  scene.userData.controls.minPolarAngle = -Math.PI;
  scene.userData.controls.maxPolarAngle = Math.PI;

  // lock Rotation if options is set
  if(this.options.verticalRotation === false) {
    scene.userData.controls.maxAzimuthAngle = scene.userData.controls.getAzimuthAngle();
    scene.userData.controls.minAzimuthAngle = scene.userData.controls.getAzimuthAngle();
  }
  if(this.options.horizontalRotation === false) {
    scene.userData.controls.maxPolarAngle = scene.userData.controls.getPolarAngle();
    scene.userData.controls.minPolarAngle = scene.userData.controls.getPolarAngle();
  }


  scene.userData.element.addEventListener('mousemove', onDocumentMouseMove, false);

  function onDocumentMouseMove (event) {
    event.preventDefault();
    mouse.x = ((rect.left + event.clientX) / width) * 2 - 1;
			mouse.y = ((rect.top -event.clientY) / height) * 2 + 1;
  }

  // if it's the first widget create the renderer, if not just add it to the widgets
  if(!this.widgetRenderer)
      PackWidget.prototype.widgetRenderer = new PackWidgetRenderer();
  this.widgetRenderer.widgets.push(this);
};

/** 
 * Renderer for the Packwidgets
 */
function PackWidgetRenderer() {
    var canvas = document.createElement("canvas");
    canvas.style.position = 'fixed';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = -1;
    document.body.appendChild(canvas);

    var widgets = [];
    this.widgets = widgets;
    var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(window.devicePixelRatio);


	// update size of the canvas element in case it was resized
    function updateSize() {
        var width = canvas.clientWidth;
        var height = canvas.clientHeight;
        if(canvas.width !== width || canvas.height !== height) {
            renderer.setSize(width, height, false);
        }
    }
    
    var animate = function() {

        render();
        
        requestAnimationFrame(animate);
    };

    this.animate = animate;

		// render canvas
    function render() {
        updateSize();
        renderer.setClearColor(0xffffff);
        renderer.enableScissorTest(false);
        renderer.clear();

        renderer.setClearColor(0xf9f9fa);
        renderer.enableScissorTest(true);

        widgets.forEach(function(widget) {

            // get viewport
            var element = widget.scene.userData.element;
            var rect = element.getBoundingClientRect();

            var width = rect.right - rect.left;
            var height = rect.bottom - rect.top;
            var left = rect.left;
            var bottom = renderer.domElement.clientHeight - rect.bottom;

            // check if it's offscreen. If so skip it
            if ( rect.bottom < 0 || rect.top  > renderer.domElement.clientHeight ||
                 rect.right  < 0 || rect.left > renderer.domElement.clientWidth ) {
                    return;
						}
	                
            renderer.setViewport(left, bottom, width, height);
            renderer.setScissor(left, bottom, width, height);
            
            widget.scene.userData.camera.aspect = width / height;
            widget.scene.userData.camera.updateProjectionMatrix();
	    
            widget.scene.userData.controls.update();
            widget.scene.userData.lights[0].position.set(widget.scene.userData.camera.position.x -
                                                         widget.scene.userData.controls.target.x,
                                                         widget.scene.userData.camera.position.y -
                                                         widget.scene.userData.controls.target.y,
                                                         widget.scene.userData.camera.position.z -
                                                         widget.scene.userData.controls.target.z);

	    
            renderer.render(widget.scene, widget.scene.userData.camera);
        });

    };
    animate();
}
