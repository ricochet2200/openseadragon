/* global module, asyncTest, $, ok, equal, notEqual, start, test, Util, testLog, propEqual */

(function() {
    var viewer;

    module('TiledImage', {
        setup: function () {
            var example = $('<div id="example"></div>').appendTo("#qunit-fixture");

            testLog.reset();

            viewer = OpenSeadragon({
                id:            'example',
                prefixUrl:     '/build/openseadragon/images/',
                springStiffness: 100 // Faster animation = faster tests
            });
        },
        teardown: function () {
            if (viewer && viewer.close) {
                viewer.close();
            }

            viewer = null;
        }
    });

    // ----------
    var checkBounds = function(image, expected, message) {
        var bounds = image.getBounds();
        equal(bounds.x, expected.x, message + ' x');
        equal(bounds.y, expected.y, message + ' y');
        equal(bounds.width, expected.width, message + ' width');
        equal(bounds.height, expected.height, message + ' height');
    };

    // ----------
    asyncTest('metrics', function() {
        var handlerCount = 0;

        viewer.addHandler('open', function(event) {
            var image = viewer.world.getItemAt(0);
            var contentSize = image.getContentSize();
            equal(contentSize.x, 500, 'contentSize.x');
            equal(contentSize.y, 2000, 'contentSize.y');

            checkBounds(image, new OpenSeadragon.Rect(5, 6, 10, 40), 'initial bounds');

            var scale = image.getContentSize().x / image.getBounds().width;
            var viewportPoint = new OpenSeadragon.Point(10, 11);
            var imagePoint = viewportPoint.minus(image.getBounds().getTopLeft()).times(scale);

            propEqual(image.viewportToImageCoordinates(viewportPoint), imagePoint, 'viewportToImageCoordinates');
            propEqual(image.imageToViewportCoordinates(imagePoint), viewportPoint, 'imageToViewportCoordinates');

            var viewportRect = new OpenSeadragon.Rect(viewportPoint.x, viewportPoint.y, 6, 7);
            var imageRect = new OpenSeadragon.Rect(imagePoint.x, imagePoint.y,
                viewportRect.width * scale, viewportRect.height * scale);

            propEqual(image.viewportToImageRectangle(viewportRect), imageRect, 'viewportToImageRectangle');
            propEqual(image.imageToViewportRectangle(imageRect), viewportRect, 'imageToViewportRectangle');

            image.addHandler('bounds-change', function boundsChangeHandler(event) {
                image.removeHandler('bounds-change', boundsChangeHandler);
                handlerCount++;
            });

            image.setPosition(new OpenSeadragon.Point(7, 8));
            checkBounds(image, new OpenSeadragon.Rect(7, 8, 10, 40), 'bounds after position');

            image.setWidth(5);
            checkBounds(image, new OpenSeadragon.Rect(7, 8, 5, 20), 'bounds after width');

            image.setHeight(4);
            checkBounds(image, new OpenSeadragon.Rect(7, 8, 1, 4), 'bounds after width');

            equal(handlerCount, 1, 'correct number of handlers called');
            start();
        });

        viewer.open({
            tileSource: '/test/data/tall.dzi',
            x: 5,
            y: 6,
            width: 10
        });
    });

    // ----------
    asyncTest('animation', function() {
        viewer.addHandler("open", function () {
            var image = viewer.world.getItemAt(0);
            propEqual(image.getBounds(), new OpenSeadragon.Rect(0, 0, 1, 1), 'target bounds on open');
            propEqual(image.getBounds(true), new OpenSeadragon.Rect(0, 0, 1, 1), 'current bounds on open');

            image.setPosition(new OpenSeadragon.Point(1, 2));
            propEqual(image.getBounds(), new OpenSeadragon.Rect(1, 2, 1, 1), 'target bounds after position');
            propEqual(image.getBounds(true), new OpenSeadragon.Rect(0, 0, 1, 1), 'current bounds after position');

            image.setWidth(3);
            propEqual(image.getBounds(), new OpenSeadragon.Rect(1, 2, 3, 3), 'target bounds after width');
            propEqual(image.getBounds(true), new OpenSeadragon.Rect(0, 0, 1, 1), 'current bounds after width');

            viewer.addHandler('animation-finish', function animationHandler() {
                viewer.removeHandler('animation-finish', animationHandler);
                propEqual(image.getBounds(), new OpenSeadragon.Rect(1, 2, 3, 3), 'target bounds after animation');
                propEqual(image.getBounds(true), new OpenSeadragon.Rect(1, 2, 3, 3), 'current bounds after animation');
                start();
            });
        });

        viewer.open('/test/data/testpattern.dzi');
    });

    // ----------
    asyncTest('update', function() {
        var handlerCount = 0;

        viewer.addHandler('open', function(event) {
            var image = viewer.world.getItemAt(0);
            equal(image.needsDraw(), true, 'needs draw after open');

            viewer.addHandler('update-level', function updateLevelHandler(event) {
                viewer.removeHandler('update-level', updateLevelHandler);
                handlerCount++;
                equal(event.eventSource, viewer, 'sender of update-level event was viewer');
                equal(event.tiledImage, image, 'tiledImage of update-level event is correct');
                ok('havedrawn' in event, 'update-level event includes havedrawn');
                ok('level' in event, 'update-level event includes level');
                ok('opacity' in event, 'update-level event includes opacity');
                ok('visibility' in event, 'update-level event includes visibility');
                ok('topleft' in event, 'update-level event includes topleft');
                ok('bottomright' in event, 'update-level event includes bottomright');
                ok('currenttime' in event, 'update-level event includes currenttime');
                ok('best' in event, 'update-level event includes best');
            });

            viewer.addHandler('update-tile', function updateTileHandler(event) {
                viewer.removeHandler('update-tile', updateTileHandler);
                handlerCount++;
                equal(event.eventSource, viewer, 'sender of update-tile event was viewer');
                equal(event.tiledImage, image, 'tiledImage of update-level event is correct');
                ok(event.tile, 'update-tile event includes tile');
            });

            viewer.addHandler('tile-drawing', function tileDrawingHandler(event) {
                viewer.removeHandler('tile-drawing', tileDrawingHandler);
                handlerCount++;
                equal(event.eventSource, viewer, 'sender of tile-drawing event was viewer');
                equal(event.tiledImage, image, 'tiledImage of update-level event is correct');
                ok(event.tile, 'tile-drawing event includes a tile');
                ok(event.context, 'tile-drawing event includes a context');
                ok(event.rendered, 'tile-drawing event includes a rendered');
            });

            viewer.addHandler('tile-drawn', function tileDrawnHandler(event) {
                viewer.removeHandler('tile-drawn', tileDrawnHandler);
                handlerCount++;
                equal(event.eventSource, viewer, 'sender of tile-drawn event was viewer');
                equal(event.tiledImage, image, 'tiledImage of update-level event is correct');
                ok(event.tile, 'tile-drawn event includes tile');

                equal(handlerCount, 4, 'correct number of handlers called');
                start();
            });

            image.draw();
        });

        viewer.open('/test/data/testpattern.dzi');
    });

    // ----------
    asyncTest('reset', function() {
        viewer.addHandler('tile-drawn', function updateHandler() {
            viewer.removeHandler('tile-drawn', updateHandler);
            ok(viewer.tileCache.numTilesLoaded() > 0, 'we have tiles after tile-drawn');
            viewer.world.getItemAt(0).reset();
            equal(viewer.tileCache.numTilesLoaded(), 0, 'no tiles after reset');

            viewer.addHandler('tile-drawn', function updateHandler2() {
                viewer.removeHandler('tile-drawn', updateHandler2);
                ok(viewer.tileCache.numTilesLoaded() > 0, 'more tiles load');
                viewer.world.getItemAt(0).destroy();
                equal(viewer.tileCache.numTilesLoaded(), 0, 'no tiles after destroy');
                start();
            });
        });

        equal(viewer.tileCache.numTilesLoaded(), 0, 'no tiles at start');

        viewer.open('/test/data/testpattern.dzi');
    });

    // ----------
    asyncTest('clip', function() {
        var clip = new OpenSeadragon.Rect(100, 100, 800, 800);

        viewer.addHandler('open', function() {
            var image = viewer.world.getItemAt(0);
            propEqual(image.getClip(), clip, 'image has correct clip');

            image.setClip(null);
            equal(image.getClip(), null, 'clip is cleared');

            image.setClip(clip);
            propEqual(image.getClip(), clip, 'clip is set correctly');

            Util.spyOnce(viewer.drawer, 'setClip', function(rect) {
                ok(true, 'drawer.setClip is called');
                var pixelRatio = viewer.viewport.getContainerSize().x / image.getContentSize().x;
                var canvasClip = clip.times(pixelRatio * OpenSeadragon.pixelDensityRatio);
                propEqual(rect, canvasClip, 'clipping to correct rect');
                start();
            });
        });

        viewer.open({
            tileSource: '/test/data/testpattern.dzi',
            clip: clip
        });
    });

    // ----------
    asyncTest('opacity', function() {

        function testDefaultOpacity() {
            viewer.removeHandler('open', testDefaultOpacity);
            var image = viewer.world.getItemAt(0);
            strictEqual(image.getOpacity(), 0.5, 'image has default opacity');

            image.setOpacity(1);
            strictEqual(image.getOpacity(), 1, 'opacity is set correctly');

            viewer.addHandler('open', testTileSourceOpacity);
            viewer.open({
                tileSource: '/test/data/testpattern.dzi',
                opacity: 0.25
            });
        }

        function testTileSourceOpacity() {
            viewer.removeHandler('open', testTileSourceOpacity);
            var image = viewer.world.getItemAt(0);
            strictEqual(image.getOpacity(), 0.25, 'image has correct opacity');

            image.setOpacity(0);
            strictEqual(image.getOpacity(), 0, 'opacity is set correctly');

            start();
        }

        viewer.addHandler('open', testDefaultOpacity);

        viewer.opacity = 0.5;
        viewer.open({
            tileSource: '/test/data/testpattern.dzi',
        });
    });

})();
