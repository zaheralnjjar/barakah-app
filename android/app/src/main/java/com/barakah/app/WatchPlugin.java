package com.barakah.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.tasks.Tasks;
import com.google.android.gms.wearable.Node;
import com.google.android.gms.wearable.Wearable;
import java.util.List;

@CapacitorPlugin(name = "WatchPlugin")
public class WatchPlugin extends Plugin {

    @PluginMethod
    public void sendMessage(PluginCall call) {
        String path = call.getString("path");
        JSObject data = call.getObject("data", new JSObject());
        String dataStr = data.toString();

        if (path == null) {
            call.reject("Must provide a path");
            return;
        }

        new Thread(() -> {
            try {
                List<Node> nodes = Tasks.await(Wearable.getNodeClient(getContext()).getConnectedNodes());
                for (Node node : nodes) {
                    Tasks.await(Wearable.getMessageClient(getContext())
                            .sendMessage(node.getId(), path, dataStr.getBytes()));
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to send message: " + e.getMessage());
            }
        }).start();
    }
}
