# Running COD nodes from containers

## Prereqs

COD defaults to using multicast/mDNS to discover mesh peers.  Note below the use of
`--net=host` which enables the container direct access to the host's networking
interfaces.

## The platform side

```
docker run -it --rm \
--net=host \
-v $PWD/autov-config.json:/app/config.json \
ghcr.io/getditto/cod-polaris-m1:670f4f9a6d639c5433ec4e8ceb72833392f1b3c5 \
node dist/autov-cod/index.js config.json
```

## The base side

```
docker run -it --rm \
--net=host \
-v $PWD/base-config.json:/app/config.json \
ghcr.io/getditto/cod-polaris-m1:670f4f9a6d639c5433ec4e8ceb72833392f1b3c5 \
node dist/base-cod/index.js config.json
```

## Pointing the COD example UI to them

Update the `ui/uiconfig.json` to point to the IP addresses/hostnames of the
hosts running the containers.  Pretty straight forward, then follow the
rest of the directions in `ui/README.md` to start the interface.
