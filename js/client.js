(function() {

	/**
	 * Called when a user selected image is loaded.
	 */
	function renderImage() {
		var image = new Image();

		image.src = event.target.result;
		// When image is loaded completely.
		image.onload = function() {
			var photoMosaic = new PhotoMosaic(image, TILE_WIDTH, TILE_HEIGHT, 'canvas');
			photoMosaic.processImage();
		};
		// When there is an error in image loading.
		image.onerror = function() {
			throw new Error('Error while loading file.');
		};
	}

	function init() {
		var reader = new FileReader();
		var inputFile = document.getElementById('input');

		// TODO: Add validations for selected file (E.g.: check if it is an image).

		// Event listener when user selects any image.
		inputFile.onchange = function() {
			// Validations for image data.
			if (event.target && event.target.files && event.target.files[0]) {
				// Read selected image data.
				reader.readAsDataURL(event.target.files[0]);
				reader.onload = renderImage;
			}
		};
	}

	window.onload = init;
})();