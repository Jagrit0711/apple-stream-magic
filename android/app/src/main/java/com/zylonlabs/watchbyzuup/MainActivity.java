package com.zylonlabs.watchbyzuup;

import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		WebView webView = getBridge().getWebView();
		WebSettings settings = webView.getSettings();

		// Block popup/new-window ads injected by embedded players.
		settings.setSupportMultipleWindows(false);
		settings.setJavaScriptCanOpenWindowsAutomatically(false);

		webView.setWebChromeClient(new WebChromeClient() {
			@Override
			public boolean onCreateWindow(
				WebView view,
				boolean isDialog,
				boolean isUserGesture,
				android.os.Message resultMsg
			) {
				return false;
			}
		});
	}
}
