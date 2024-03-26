# Running COD nodes (autov or base) from containers

The current version of the container will update as we revise the COD capability. At the time of writing this doc the version was:

`ghcr.io/getditto/cod-polaris-m1:d2f4618f8344b2debfd417f313f960c0af103609`

More info here:

[The COD container in GitHub](https://github.com/getditto/cod-polaris-m1/pkgs/container/cod-polaris-m1/195514013?tag=d2f4618f8344b2debfd417f313f960c0af103609)

## Prereqs

COD defaults to using multicast/mDNS to discover mesh peers. Note below the use of
`--net=host` which enables the container direct access to the host's networking
interfaces.

An install of a container runtime such as Docker or Podman - we've tested with both on both AMD64 and aarch64 targets.

## The platform side

Copy the following into a `autov-config.json` file:

```
{
    "ditto": {
        "app-id": "XXX",
        "app-token": "XXX",
        "shared-key": "",
        "offline-token": "",
        "use-cloud": false,
        "use-lan": true,
        "use-ble": true,
        "bpa-url": "portal",
        "test-duration-sec": "60",
        "http-port": "8082",
        "log-level": "debug"
    }
}
```

Then run:

```
docker run -it --rm \
--net=host \
-v $PWD/autov-config.json:/app/config.json \
ghcr.io/getditto/cod-polaris-m1:d2f4618f8344b2debfd417f313f960c0af103609 \
node dist/autov-cod/index.js config.json
```

## The base side

Copy the following into a `base-config.json` file:

```
{
    "ditto": {
        "app-id": "XXX",
        "app-token": "XXX",
        "shared-key": "",
        "offline-token": "",
        "use-cloud": false,
        "use-lan": true,
        "use-ble": true,
        "bpa-url": "portal",
        "test-duration-sec": "60",
        "http-port": "8081",
        "log-level": "debug"
    }
}
```

Then run:

```
docker run -it --rm \
--net=host \
-v $PWD/base-config.json:/app/config.json \
ghcr.io/getditto/cod-polaris-m1:670f4f9a6d639c5433ec4e8ceb72833392f1b3c5 \
node dist/base-cod/index.js config.json
```

## Pointing the COD example-UI to them

NOTE: this UI was developed for the sole purpose of driving test messages
visually to the base-side interface, after "arming" the UxV. To run the UI it requires modification of some configuration to map to the IP/FQDN of the running nodes.

Update the `ui/uiconfig.json` to point to the IP addresses/hostnames of the
hosts running the containers. Following the configuration update, follow the
rest of the directions in `ui/README.md` to start the interface in your browser.
