var assert = chai.assert;

describe('PhotoMosaic', function() {

	describe('object creation spec', function() {
		it('PhotoMosaic should be available', function() {
			// Check if PhotoMosaic is loaded.
			assert.isDefined(PhotoMosaic, "PhotoMosaic should be defined.");
		});

		it('invalid data', function() {
			// Object creation by passing no data.
			assert.throws(function() {
				new PhotoMosaic();
			}, 'Invalid data passed', 'should thow error.');
		});

		it('valid data', function() {
			// Check Object creation if valid data is passed.
			var photoMosaic = new PhotoMosaic(new Image(), 16, 16, 'canvas');
			assert.isDefined(photoMosaic, 'Object should be created successfully.');
			assert.strictEqual(photoMosaic.tileWidth, 16, 'Width should be 16.');
			assert.strictEqual(photoMosaic.targetId, 'canvas', 'target Id should be canvas.');
		});
	});

	describe('processImage spec', function () {
		var image;
		var photoMosaic;
		var contextSpy;
		var renderImageMock;
		var processRowMock;

		beforeEach(function() {
			image = new Image();
			image.width = 10;
			image.height = 10;
			photoMosaic = new PhotoMosaic(image, 16, 16, 'canvas');
			// Spy on photoMosaic.canvasContext.drawImage API
			contextSpy = sinon.spy(photoMosaic.canvasContext, 'drawImage');
			// Create mocks for renderImages and processRow API's as we don't need to call them in this test.
			renderImageMock = sinon.mock(photoMosaic).expects('renderImages').once();
			processRowMock = sinon.mock(photoMosaic).expects('processRow').once();
		});

		afterEach(function () {
			// restore original state.
			photoMosaic.renderImages.restore();
			photoMosaic.processRow.restore();
		});

		it('Test positive cases', function() {
			photoMosaic.processImage();
			// Verify if mock conditions are met.
			renderImageMock.verify();
			processRowMock.verify();
			// Verify if photoMosaic.canvasContext.drawImage is called once.
			assert(contextSpy.calledOnce, 'drawImage should be called exactly once.');
		});
	});

	describe('getContext spec', function() {
		var image;
		var photoMosaic;

		beforeEach(function() {
			image = new Image();
			image.width = 123;
			image.height = 456;
			photoMosaic = new PhotoMosaic(image, 16, 16, 'canvas');
		});

		it('pass invalid element', function() {
			var element = document.createElement('button');
			// Pass invalid element (Here button is invalid.)
			assert.throws(function() {
				photoMosaic.getContext(element)
			});
		});

		it('pass canvas element', function() {
			var element = document.createElement('canvas');
			var context = photoMosaic.getContext(element);
			assert.isDefined(context, 'should be defined.');
			assert.strictEqual(element.getContext('2d'), context, 'context should be same.');
			assert.strictEqual(element.width, 123, 'width should be 123.');
			assert.strictEqual(element.height, 456, 'height should be 456.');
		});
	});

	describe('processRow spec', function() {
		var image;
		var photoMosaic;
		var imagesCount;

		beforeEach(function() {
			image = new Image();
			var tile = {
				width: 16,
				height: 16
			};

			image.width = 32;
			image.height = 456;
			photoMosaic = new PhotoMosaic(image, tile.width, tile.height, 'canvas');
			// Should be called twice as (image.width / tile.width) is 2 (32 / 16).
			imagesCount = image.width / tile.width;
		});

		afterEach(function() {
			// Restore previous state.
			photoMosaic.requestImage.restore();
		});

		it('resolve promise check', function() {
			var imagePromise = new Promise(function(resolve) {
				// Resolve this promise immediately.
				resolve({
					image: image
				});
			});
			// Mock photoMosaic.requestImage API to return 'imagePromise'.
			var mock = sinon.mock(photoMosaic).expects('requestImage').exactly(imagesCount).returns(imagePromise);
			var rowPromise = photoMosaic.processRow(0);

			return rowPromise.then(function fulfilled(result) {
				// Validate resolved data.
				assert.strictEqual(result.length, imagesCount, 'Loaded images length should be ' + imagesCount);
				mock.verify();
			}, function rejected(err) {
				// Throw error promise is rejected.
				throw new Error('Promise was unexpectedly rejected. Error: ' + err);
			});
		});

		it('reject promise check', function() {
			var errormessage = 'Mock failure.';
			var imagePromise = new Promise(function(resolve, reject) {
				// Reject promise immediately.
				reject(errormessage);
			});
			// Create mock for photoMosaic.requestImage API to return 'imagePromise'.
			var mock = sinon.mock(photoMosaic).expects('requestImage').exactly(imagesCount).returns(imagePromise);
			var rowPromise = photoMosaic.processRow(0);

			return rowPromise.then(function fulfilled(result) {
				// Throw error is promise is resolved.
				throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
			}, function rejected(err) {
				// Validate error message.
				assert.strictEqual(err, errormessage);
				mock.verify();
			});
		});
	});

	describe('rgbToHex spec', function() {
		var photoMosaic;

		beforeEach(function() {
			photoMosaic = new PhotoMosaic(new Image(), 16, 16, 'canvas');
		});

		it('check if returned value is correct', function() {
			assert.equal(photoMosaic.rgbToHex(112, 123, 240), '707bf0', 'Hex value should be 707bf0.');
			assert.equal(photoMosaic.rgbToHex(2, 39, 140), '02278c', 'Hex value should be 02278c.');
		});
	});

	describe('componentToHex spec', function() {
		var photoMosaic;

		beforeEach(function() {
			photoMosaic = new PhotoMosaic(new Image(), 16, 16, 'canvas');
		});

		it('check if returned value is correct', function() {
			assert.strictEqual(photoMosaic.componentToHex(112), '70', 'Hex value should be 70.');
			assert.strictEqual(photoMosaic.componentToHex(1), '01', 'Hex value should be 01.');
		});
	});

	describe('getTileAverageColor spec', function() {
		var photoMosaic;
		var tileData = [129, 91, 71, 255, 130, 92, 71, 255, 128, 90, 68, 255, 125, 87, 66, 255, 131, 90, 70, 255, 133, 94, 72, 255, 131, 92, 69, 255, 129, 88, 67, 255, 129, 85, 65, 255, 131, 89, 67, 255, 131, 90, 67, 255, 133, 89, 69, 255, 130, 85, 64, 255, 130, 86, 65, 255, 133, 90, 67, 255, 138, 91, 71, 255];

		beforeEach(function() {
			photoMosaic = new PhotoMosaic(new Image(), 4, 4, 'canvas');
		});

		it('check if returned value is correct', function() {
			assert.strictEqual(photoMosaic.getTileAverageColor(tileData), '825944', 'Tile average hex color should be 825944');
		});
	});

	describe('renderImages spec', function() {
		var image;
		var photoMosaic;
		var imagePromises = [];
		var documentMock;
		var contextSpy;

		beforeEach(function() {
			image = new Image();
			photoMosaic = new PhotoMosaic(new Image(), 4, 4, 'canvas');

			// Create dummy row promises which will be resolved immediately.
			function createRowPromise() {
				var rowPromises = [];
				for (var i = 0; i < 2; ++i) {
					rowPromises.push(new Promise(function(resolve) {
						resolve({
							image: image
						});
					}));
				}
				return Promise.all(rowPromises);
			}

			imagePromises.push(createRowPromise());
			imagePromises.push(createRowPromise());

			documentMock = sinon.mock(document).expects('getElementById').once().returns(document.createElement('canvas'));
			contextSpy = sinon.spy(CanvasRenderingContext2D.prototype, 'drawImage');
		});

		afterEach(function() {
			document.getElementById.restore();
		});

		it('Test positive cases', function() {
			photoMosaic.renderImages(imagePromises);
			documentMock.verify();

			// arguments: image, x, y, tile_width, tile_height
			contextSpy.withArgs(image, 0, 0, 4, 4);
			contextSpy.withArgs(image, 4, 0, 4, 4);
			contextSpy.withArgs(image, 0, 4, 4, 4);
			contextSpy.withArgs(image, 4, 4, 4, 4);

			Promise.all(imagePromises).then(function() {
				assert.equal(contextSpy.callCount, 4, 'context.drawImage should be called four times.');
				assert(contextSpy.withArgs(image, 0, 0, 4, 4).calledOnce);
				assert(contextSpy.withArgs(image, 4, 0, 4, 4).calledOnce);
				assert(contextSpy.withArgs(image, 0, 4, 4, 4).calledOnce);
				assert(contextSpy.withArgs(image, 4, 4, 4, 4).calledOnce);
			});
		});
	});

});
