chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('vasco.html', {
    singleton: true,
	resizable: false,
    // state: "fullscreen",
    id: "Vasco SecureClick"
  });
});

