/**
 * PhotoMosaic Constructor: Used to create Mosaic image 
 * @param {Image} image      [The Image file you want to convert]
 * @param {Number} tileWidth  [Each Tile width]
 * @param {Number} tileHeight [Each Tile height]
 * @param {String} targetId   [The element Id where you want to show output]
 */
function PhotoMosaic(image, tileWidth, tileHeight, targetId) {
	// Check for required parameters.
	if (!image || !tileWidth || !tileHeight || !targetId) {
		throw new Error('Invalid data passed');
	}

	var canvasElem = document.createElement('canvas');

	this.image = image;
	this.tileWidth = tileWidth;
	this.tileHeight = tileHeight;
	this.imageWidth = image.width;
	this.imageHeight = image.height;
	this.targetId = targetId;
	this.mosaicsCache = {};
	this.canvasContext = this.getContext(canvasElem);
}

/**
 * [First API to call after object creation to start image conversion]
 */
PhotoMosaic.prototype.processImage = function() {
	// Array of promises for each row.
	var imagePromises = [];

	// Draw the user selected image temporary canvas element.
	this.canvasContext.drawImage(this.image, 0, 0, this.imageWidth, this.imageHeight);

	// process each row (here tile height is taken as row height)
	for (var y = 0; y < this.imageHeight; y += this.tileHeight) {
		imagePromises.push(this.processRow(y));
	}

	// Finally render each row one by one.
	this.renderImages(imagePromises, this.targetId);
};

/**
 * [Get context of a canvas element.]
 * @param element [DOM node]
 * @return Context of the canvas element.
 */
PhotoMosaic.prototype.getContext = function(element) {
	// Assign image width and height.
	element.width = this.imageWidth;
	element.height = this.imageHeight;
	return element.getContext('2d');
};

/**
 * Process each row of the image.
 * @param  {Number} y [Tile Height or row height]
 * @return {Promise}   [Single promise which resolves when all tile images in row are fetched.]
 */
PhotoMosaic.prototype.processRow = function(y) {
	// Array of promises for each tile image fetch.
	var rowPromises = [];

	// Iterate over each Tile.
	for (var x = 0; x < this.imageWidth; x += this.tileWidth) {
		// get each Tile data.
		var tileData = this.canvasContext.getImageData(x, y, this.tileWidth, this.tileHeight);
		// Calulate average hex color for the tile.
		var avgHexColor = this.getTileAverageColor(tileData.data);
		// Fetch image from the server.
		rowPromises.push(this.requestImage(avgHexColor));
	}

	// Return a single promise which resolves when all tile images are resolved.
	return Promise.all(rowPromises);
};

/**
 * Calulates average Hex color of the Tile.
 * @param  {Array} tileData [Image Tile Data]
 * @return {String}          [Average Hex color]
 */
PhotoMosaic.prototype.getTileAverageColor = function(tileData) {
	var r, g, b, a;
	var totalPixels = this.tileWidth * this.tileHeight;
	r = g = b = a = 0;

	// Calulate sum of r, g, b, a values.
	for (var i = 0, len = tileData.length; i < len; i += 4) {
		r += tileData[i];
		g += tileData[i + 1];
		b += tileData[i + 2];
		a += tileData[i + 3];
	}

	// Calculate average r, g, b values.
	r = Math.floor(r / totalPixels);
	g = Math.floor(g / totalPixels);
	b = Math.floor(b / totalPixels);

	// convert rgb value to Hex.
	return this.rgbToHex(r, g, b);
};

/**
 * Fetches image from the server for the given Hex color.
 * @param  {String} hexColor [Hex color value]
 * @return {Promise}          [Resolves when image fetch from server is done.]
 */
PhotoMosaic.prototype.requestImage = function(hexColor) {
	// Check if we made a request for this Hex color earlier.
	if (!this.mosaicsCache[hexColor]) {
		var img = new Image;
		img.src = '/color/' + hexColor;
		// Create promise
		this.mosaicsCache[hexColor] = new Promise(function(resolve) {
			// TODO: Handle image load error here.
			img.onload = function() {
				// Resolve when image loading is done.
				resolve({
					image: img
				});
			};
		});
	}
	// Return image fetch Promise.
	return this.mosaicsCache[hexColor];
};

/**
 * Converts RGB vale to Hex.
 * @param  {Number} r
 * @param  {Number} g
 * @param  {Number} b
 * @return {String}   [Hex value]
 */
PhotoMosaic.prototype.rgbToHex = function(r, g, b) {
	return this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
};

/**
 * Converts decimal number to Hexadecimal value
 * @param  {Number} c [decimal number]
 * @return {String}   [Hexadecimal value]
 */
PhotoMosaic.prototype.componentToHex = function(c) {
	var hex = c.toString(16);
	// Server expects 6 digit Hex value, so prepend '0' if value is less than A (10).
	return hex.length == 1 ? ('0' + hex) : hex;
};

/**
 * [Render images row by row]
 * @param  {Array} imagePromises [Array of promises]
 */
PhotoMosaic.prototype.renderImages = function(imagePromises) {
	var context = this.getContext(document.getElementById(this.targetId));
	// copy of this (as 'this' value inside promise resolve function is different from what we want).
	var _this = this;

	// Clear rect befor rendering.
	context.clearRect(0, 0, this.imageWidth, this.imageHeight);

	imagePromises.forEach(function(rowPromise, rowId) {
		// When each row promise is resolved i.e. all the tile images in row are loaded.
		rowPromise.then(function(loadedImages) {
			var y = rowId * _this.tileHeight;
			// Iterate through all images and render them.
			loadedImages.forEach(function(imageData, colId) {
				// x: colId * _this.tileWidth, y : _this.tileHeight * rowId
				context.drawImage(imageData.image, colId * _this.tileWidth, y, _this.tileWidth, _this.tileHeight);
			});
		});
	});
};
