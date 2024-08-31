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
    };

    var scale = 1; // Initial scale
    var lastScale = 1; // To store the last scale value after pinch

    function resetZoom() {
        scale = 1;
        imgElement.style.transform = 'translate(-50%, -50%) scale(1)';
        lastScale = 1;
    }

    var changeEvent = function() {
        var $this = $gallery.find('a[data-id="' + window.location.hash + '"]');
        if ($this.length == 1) {
            var index = $this.parent().index();
            resetZoom();
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
    };

    var changeHash = function(hash) {
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
        velocity: 0.8   // Minimum speed (in pixels/second) to trigger a swipe
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

    // Variables for panning and zooming
    var scale = 1;
    var lastScale = 1;
    var panX = 0;
    var panY = 0;
    var lastPanX = 0;
    var lastPanY = 0;
    var isDragging = false;

    // Handle pinch event for zoom
    pinchZoom.on('pinch', function(ev) {
        scale = Math.max(1, Math.min(lastScale * ev.scale, 5)); // Limit zoom between 1x and 5x
        updateImageTransform();
    });

    pinchZoom.on('pinchend', function() {
        lastScale = scale;
    });

    // Reset zoom and position on double tap
    pinchZoom.on('doubletap', function() {
        resetZoom();
    });

    // Mouse events for panning
    imgElement.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);

    // Touch events for panning
    imgElement.addEventListener('touchstart', startDragging);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', stopDragging);

    function startDragging(e) {
        if (scale > 1) {
            e.preventDefault();
            isDragging = true;
            lastPanX = e.clientX || e.touches[0].clientX;
            lastPanY = e.clientY || e.touches[0].clientY;
        }
    }

    function drag(e) {
        if (isDragging && scale > 1) {
            e.preventDefault();
            var clientX = e.clientX || e.touches[0].clientX;
            var clientY = e.clientY || e.touches[0].clientY;
            
            var deltaX = clientX - lastPanX;
            var deltaY = clientY - lastPanY;
            
            panX += deltaX / scale;
            panY += deltaY / scale;
            
            lastPanX = clientX;
            lastPanY = clientY;
            
            updateImageTransform();
        }
    }

    function stopDragging() {
        isDragging = false;
    }

    function updateImageTransform() {
        // Calculate the maximum allowed panning
        var imgRect = imgElement.getBoundingClientRect();
        var containerRect = imgElement.parentElement.getBoundingClientRect();
        
        var maxPanX = (imgRect.width * scale - containerRect.width) / (2 * scale);
        var maxPanY = (imgRect.height * scale - containerRect.height) / (2 * scale);
        
        // Limit panning to keep image within view
        panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
        panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
        
        imgElement.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale})`;
    }

    function resetZoom() {
        scale = 1;
        panX = 0;
        panY = 0;
        lastScale = 1;
        updateImageTransform();
    }

    changeEvent();
})();
