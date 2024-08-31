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

    // Variables for panning and zooming
    var scale = 1;
    var lastScale = 1;
    var panX = 0;
    var panY = 0;
    var lastPanX = 0;
    var lastPanY = 0;
    var isDragging = false;
    var panVelocity = 3; // Adjust this value to increase/decrease panning speed

    // Hammer.js configuration
    var imgElement = document.querySelector('.overlay img');
    var hammer = new Hammer(imgElement);
    hammer.get('pinch').set({ enable: true });
    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });

    // Pinch to zoom
    hammer.on('pinchstart', function(ev) {
        imgElement.style.transition = 'none'; // Remove transition for smoother zooming
    });

    hammer.on('pinch', function(ev) {
        var currentScale = scale * ev.scale;
        currentScale = Math.max(1, Math.min(currentScale, 5)); // Limit zoom between 1x and 5x
        
        // Calculate zoom center point
        var zoomCenterX = (ev.center.x - imgElement.offsetLeft) / scale;
        var zoomCenterY = (ev.center.y - imgElement.offsetTop) / scale;
        
        // Adjust pan position based on zoom center
        panX = zoomCenterX - (zoomCenterX * currentScale / scale) + panX;
        panY = zoomCenterY - (zoomCenterY * currentScale / scale) + panY;
        
        scale = currentScale;
        updateImageTransform();
    });

    hammer.on('pinchend', function() {
        lastScale = scale;
        imgElement.style.transition = 'transform 0.3s'; // Restore transition
    });

    // Pan
    hammer.on('panstart', function(ev) {
        if (scale > 1) {
            isDragging = true;
            lastPanX = ev.center.x;
            lastPanY = ev.center.y;
            imgElement.style.transition = 'none'; // Remove transition for smoother panning
        }
    });

    hammer.on('panmove', function(ev) {
        if (isDragging && scale > 1) {
            var deltaX = ev.center.x - lastPanX;
            var deltaY = ev.center.y - lastPanY;
            
            panX += (deltaX / scale) * panVelocity;
            panY += (deltaY / scale) * panVelocity;
            
            lastPanX = ev.center.x;
            lastPanY = ev.center.y;
            
            updateImageTransform();
        }
    });

    hammer.on('panend', function() {
        isDragging = false;
        imgElement.style.transition = 'transform 0.3s'; // Restore transition
    });

    // Swipe to change images (only when not zoomed)
    hammer.on('swipeleft', function() {
        if (scale === 1 && $next.is(':visible')) {
            changeHash($next.attr('href'));
        }
    });

    hammer.on('swiperight', function() {
        if (scale === 1 && $prev.is(':visible')) {
            changeHash($prev.attr('href'));
        }
    });

    // Double tap to reset zoom
    hammer.on('doubletap', function() {
        resetZoom();
    });

    function updateImageTransform() {
        // Calculate the maximum allowed panning
        var imgRect = imgElement.getBoundingClientRect();
        var containerRect = imgElement.parentElement.getBoundingClientRect();
        
        var maxPanX = Math.max(0, (imgRect.width * scale - containerRect.width) / (2 * scale));
        var maxPanY = Math.max(0, (imgRect.height * scale - containerRect.height) / (2 * scale));
        
        // Limit panning to keep image within view
        panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
        panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
        
        imgElement.style.transform = `translate(-50%, -50%) translate(${panX}px, ${panY}px) scale(${scale})`;
    }

    function resetZoom() {
        scale = 1;
        panX = 0;
        panY = 0;
        lastScale = 1;
        updateImageTransform();
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

    changeEvent();
})();