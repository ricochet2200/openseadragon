/* global module, asyncTest, $, ok, equal, notEqual, start, test, Util, testLog, expect */

( function() {
    var viewer;

    module( 'Multi-Image', {
        setup: function() {
            $( '<div id="itemsexample"></div>' ).appendTo( "#qunit-fixture" );

            testLog.reset();

            viewer = OpenSeadragon( {
                id: 'itemsexample',
                prefixUrl: '/build/openseadragon/images/',
                springStiffness: 100 // Faster animation = faster tests
            });
        },
        teardown: function() {
            if ( viewer && viewer.close ) {
                viewer.close();
            }

            viewer = null;
            $( "#itemsexample" ).remove();
        }
    } );

    // ----------
    asyncTest( 'Multi-image operations', function() {
        expect( 21 );
        viewer.addHandler( "open", function( ) {
            equal( 1, viewer.world.getItemCount( ),
                "One item should be present after opening." );
            var options = {
                tileSource: {
                    type: 'legacy-image-pyramid',
                    levels: [ {
                            url: "data/A.png",
                            width: 1000,
                            height: 1000
                        } ]
                }
            };
            viewer.addTiledImage( options );
            viewer.world.addHandler( "add-item", function addFirstItemHandler( event ) {
                viewer.world.removeHandler( "add-item", addFirstItemHandler );
                var item1 = event.item;
                equal( viewer.world.getItemCount( ), 2,
                    "2 items should be present after adding a item." );
                equal( viewer.world.getIndexOfItem( item1 ), 1,
                    "The first added item should have a index of 1" );
                equal( viewer.world.getItemAt( 1 ), item1,
                    "The item at index 1 should be the first added item." );

                viewer.addTiledImage( options );
                viewer.world.addHandler( "add-item", function addSecondItemHandler( event ) {
                    viewer.world.removeHandler( "add-item", addSecondItemHandler );
                    var item2 = event.item;
                    equal( viewer.world.getItemCount( ), 3,
                        "3 items should be present after adding a second item." );
                    equal( viewer.world.getIndexOfItem( item2 ), 2,
                        "If not specified, a item should be added with the highest index." );
                    equal( viewer.world.getItemAt( 2 ), item2,
                        "The item at index 2 should be the second added item." );

                    viewer.world.addHandler( "item-index-change",
                        function itemIndexChangedHandler( event ) {
                            viewer.world.removeHandler( "item-index-change",
                                itemIndexChangedHandler );
                            equal( event.item, item2,
                                "The item which changed index should be item2" );
                            equal( event.previousIndex, 2, "Previous index should be 2." );
                            equal( event.newIndex, 1, "New index should be 1." );
                        });
                    viewer.world.setItemIndex( item2, 1 );
                    equal( viewer.world.getIndexOfItem( item2 ), 1,
                        "Item2 index should be 1 after setItemIndex." );
                    equal( viewer.world.getIndexOfItem( item1 ), 2,
                        "Item1 index should be 2 after setItemIndex." );
                    equal( viewer.world.getItemAt( 1 ), item2,
                        "The item at index 1 should be item2." );
                    equal( viewer.world.getItemAt( 2 ), item1,
                        "The item at index 2 should be item1." );

                    options.index = 2;
                    options.tileSource.levels[0].url = "data/CCyan.png";
                    viewer.addTiledImage( options );
                    viewer.world.addHandler( "add-item", function addThirdItemHandler( event ) {
                        viewer.world.removeHandler( "add-item", addThirdItemHandler );
                        var item3 = event.item;
                        equal( viewer.world.getItemCount( ), 4,
                            "4 items should be present after adding a third item." );
                        equal( viewer.world.getIndexOfItem( item3 ), 2,
                            "Item 3 should be added with index 2." );
                        equal( viewer.world.getIndexOfItem( item2 ), 1,
                            "Item 2 should stay at index 1." );

                        viewer.world.addHandler( "remove-item", function removeItemHandler( event ) {
                            viewer.world.removeHandler( "remove-item", removeItemHandler );

                            equal( item2, event.item, "Removed item should be item2." );

                            equal( viewer.world.getIndexOfItem( item1 ), 2,
                                "Item 1 should be at index 2." );
                            equal( viewer.world.getIndexOfItem( item2 ), -1,
                                "Item 2 should be at index -1." );
                            equal( viewer.world.getIndexOfItem( item3 ), 1,
                                "Item 3 should be at index 1." );

                            start();
                        });

                        viewer.world.removeItem( item2 );
                    });
                });
            });
        });
        viewer.open( '/test/data/testpattern.dzi' );
    });

    // ----------
    asyncTest( 'Sequences as items', function() {
        var options = {
            tileSource: [{
                    type: 'legacy-image-pyramid',
                    levels: [{
                            url: "data/A.png",
                            width: 1000,
                            height: 1000
                        }]
                }, {
                    type: 'legacy-image-pyramid',
                    levels: [{
                            url: "data/BBlue.png",
                            width: 1000,
                            height: 1000
                        }]
                }]
        };

        viewer.addHandler( "open", function openHandler() {
            viewer.removeHandler( "open", openHandler );

            viewer.addHandler( "add-item-failed",
                function addItemFailedHandler( event ) {
                    viewer.removeHandler( "add-item-failed", addItemFailedHandler );
                    equal( event.message, "[Viewer.addTiledImage] Sequences can not be added; add them one at a time instead." );
                    equal( event.options, options, "Item failed event should give the options." );
                    start();
                } );
            viewer.addTiledImage( options );

        });
        viewer.open( '/test/data/testpattern.dzi' );
    });

    // ----------
    asyncTest('items are added in order', function() {
        viewer.addHandler('open', function(event) {
            equal(viewer.world.getItemAt(0).getContentSize().y, 2000, 'first image is tall');
            equal(viewer.world.getItemAt(0).getBounds().width, 4, 'first image has 4 width');
            equal(viewer.world.getItemAt(1).getContentSize().x, 2000, 'second image is wide');
            equal(viewer.world.getItemAt(1).getBounds().width, 2, 'second image has 2 width');
            start();
        });

        viewer.open([
            {
                tileSource: '/test/data/tall.dzi',
                width: 4
            }, {
                tileSource: '/test/data/wide.dzi',
                width: 2
            }
        ]);
    });

})();
