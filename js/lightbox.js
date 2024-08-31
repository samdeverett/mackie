(function() {
    var $overlay = $('.overlay'),
        $overlayImage = $overlay.find('img'),
        $caption = $overlay.find('.caption'),
        $body = $('body'),
        $close = $overlay.find('.close'),
        $next = $overlay.find('.next'),
        $prev = $overlay.find('.prev'),
        $gallery = $('.gallery'),
        fadeTime = 200;

    $gallery.after('<ul class="cache"></ul>');

    var $cache = $('.cache');

    var addToCache = function(src) {
            if ($cache.find('img[src="' + src + '"]').length < 1) {
                $cache.append('<li><img src="' + src + '"></li>');
            }
        },
        changeEvent = function() {
            var $this = $gallery.find('a[data-id="' + window.location.hash + '"]');
            if ($this.length == 1) {
                var index = $this.parent().index();
                $overlayImage.fadeOut(fadeTime, function() {
                    $overlayImage.attr('src', $this.attr('href')).fadeIn(fadeTime);
                    $caption.html($this.attr('data-caption'));
                });
                $body.addClass('overlay-active');

                if (index > 0) {
                    var $prevEl = $gallery.children().eq(index - 1).find('a');
                    $prev.attr('href', $prevEl.attr('data-id')).show();
                    addToCache($prevEl.attr('href'));
                }
                else {
                    $prev.hide();
                }

                if (index < $gallery.find('a:last').parent().index()) {
                    var $nextEl = $gallery.children().eq(index + 1).find('a');
                    $next.attr('href', $nextEl.attr('data-id')).show();
                    addToCache($nextEl.attr('href'));
                }
                else {
                    $next.hide();
                }

                addToCache($this.attr('href'));
            }
            else {
                $body.removeClass('overlay-active');
                $overlayImage.attr('src', '');
            }
        },
        changeHash = function(hash) {
            history.replaceState(undefined, undefined, hash);
            changeEvent();
        };

    $close.click(function() {
        changeHash('#');
    });

    $prev.click(function() {
        changeHash($prev.attr('href'));
        return false;
    });

    $next.click(function() {
        changeHash($next.attr('href'));
        return false;
    });

    $gallery.find('a').click(function(e) {
        var $this = $(this);
        changeHash($this.attr('data-id'));
        return false;
    });

    // Arrow key support
    $(document).keyup(function(e) {
        switch (e.which) {
            case 37: // left
                if ($prev.is(':visible')) {
                    changeHash($prev.attr('href'));
                    resetZoom();
                }
                break;

            case 39: // right
                if ($next.is(':visible')) {
                    changeHash($next.attr('href'));
                    resetZoom();
                }
                break;

            case 27: // escape
                changeHash('#');
                break;

            default:
                return; // exit this handler for other keys
        }
        e.preventDefault();
    });

    // Add swipe detection with Hammer.js
    var overlayElement = document.querySelector('.overlay');
    var hammer = new Hammer(overlayElement);

    // Configure swipe settings
    hammer.get('swipe').set({
        direction: Hammer.DIRECTION_HORIZONTAL,
        threshold: 40, // Minimum distance (in pixels) required to trigger a swipe
        velocity: 0.3   // Minimum speed (in pixels/second) to trigger a swipe
    });

    // Handle swipe events and reset zoom
    hammer.on('swipeleft', function() {
        if ($next.is(':visible')) {
            changeHash($next.attr('href'));
            resetZoom();
        }
    });

    hammer.on('swiperight', function() {
        if ($prev.is(':visible')) {
            changeHash($prev.attr('href'));
            resetZoom();
        }
    });

    // Enable pinch-to-zoom and panning for the image
    var imgElement = document.querySelector('.overlay img');
    var pinchZoom = new Hammer(imgElement);

    // Enable pinch gestures
    pinchZoom.get('pinch').set({ enable: true });
    pinchZoom.get('pan').set({ enable: true }); // Enable panning

    var scale = 1; // Initial scale
    var lastScale = 1; // To store the last scale value after pinch
    var posX = 0, posY = 0; // Variables to store the current position
    var lastPosX = 0, lastPosY = 0; // To store the last pan positions
    var maxPosX, maxPosY, transform; // Variables for boundary checks

    // Handle pinch event for zoom
    pinchZoom.on('pinch', function(ev) {
        scale = Math.max(1, lastScale * ev.scale); // Limit zoom-out to the original image size (1x)
        transform = 'translate(' + posX + 'px, ' + posY + 'px) scale(' + scale + ')';
        imgElement.style.transform = transform;
    });

    pinchZoom.on('pinchend', function() {
        lastScale = scale; // Update the last scale after pinch ends
    });

    // Handle pan event for moving the image
    pinchZoom.on('pan', function(ev) {
        if (scale > 1) { // Only allow panning if the image is zoomed in
            posX = lastPosX + ev.deltaX;
            posY = lastPosY + ev.deltaY;

            // Boundary checks to prevent panning out of image limits
            maxPosX = Math.max((scale - 1) * imgElement.clientWidth / 2, 0);
            maxPosY = Math.max((scale - 1) * imgElement.clientHeight / 2, 0);

            posX = Math.min(Math.max(posX, -maxPosX), maxPosX);
            posY = Math.min(Math.max(posY, -maxPosY), maxPosY);

            transform = 'translate(' + posX + 'px, ' + posY + 'px) scale(' + scale + ')';
            imgElement.style.transform = transform;
        }
    });

    pinchZoom.on('panend', function() {
        lastPosX = posX;
        lastPosY = posY;
    });

    // Reset zoom and position on double tap
    pinchZoom.on('doubletap', function() {
        resetZoom();
    });

    // Function to reset zoom and position
    function resetZoom() {
        scale = 1;
        posX = posY = lastPosX = lastPosY = 0;
        imgElement.style.transform = 'translate(0, 0) scale(1)';
        lastScale = 1;
    }

    changeEvent();
})();
