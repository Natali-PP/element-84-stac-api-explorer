import { searchSTAC } from "./services/stacServices";
import { useEffect, useRef, useState } from "react";
import useSTACStore from "./stores/stacStore";
import Map, { Layer, Source } from "react-map-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
//import "./index.module.css";
import type { MapRef } from "react-map-gl";
import { motion } from "framer-motion";
import { centroid } from "@turf/centroid";
import { IoArrowBack } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import "./App.css";
import Card from "./components/Card/Card";
import { BsArrowsCollapse } from "react-icons/bs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { RxCrosshair2 } from "react-icons/rx";
import { DateRangePicker } from "./components/DateRangePicker/DateRangePicker";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { calculateBboxCenter, formatCoordinatesRasterImages } from "./helpers";

function App() {
  const [loading, setLoading] = useState<boolean>(false);
  //const [error, setError] = useState<string | null>(null);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [geoJSONPolygon, setGeoJSONPolygon] = useState({
    type: "",
    coordinates: {},
  });
  const [drawCenter, setDrawCenter] = useState<[number, number]>([0, 0]);
  const {
    updateFeatures,
    features,
    featureCollectionResponse,
    setPosition,
    updateFeatureCollectionResponse,
    selectedFeatureInMap,
    isMapImageVisible,
  } = useSTACStore();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2023, 0, 2),
    to: addDays(new Date(2023, 0, 20), 20),
  });
  const [collection, setCollection] = useState<string>("");

  const FormSchema = z.object({
    collection: z.string({
      required_error: "Please select a collection for this search.",
    }),
    polygon: z.object({
      type: z.string(),
      coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))), // Ensuring it's an array of [number, number]
    }),
    datetime: z.object({
      from: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid start date",
      }),
      to: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid end date",
      }),
    }),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const handleSearch = async () => {
    setLoading(true);

    setPosition({ latitude: 40.7128, longitude: -74.006 });

    try {
      const data = await searchSTAC({
        collections: [collection],
        intersects: geoJSONPolygon, // Pass the polygon as geometry
        datetime: `${date?.from?.toISOString().split("T")[0]}T00:00:00Z/${
          date?.to?.toISOString().split("T")[0]
        }T23:59:59Z`,
        limit: 10,
      });

      updateFeatureCollectionResponse(data);
      updateFeatures(data.features);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMenuExpanded(true);
      // Trigger animation or delay here
      if (drawRef.current) mapRef.current?.removeControl(drawRef.current);
      setTimeout(() => {
        setLoading(false);
        setShowResults(true);
      }, 1000);
    }
  };

  useEffect(() => {
    const map = mapRef.current?.getMap();

    if (map) {
      if (controlsVisible) {
        if (!drawRef.current) {
          drawRef.current = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
              polygon: true,
              trash: true,
            },
          });
        }

        // Add control to the map
        if (drawRef.current && !map.hasControl(drawRef.current)) {
          map.addControl(drawRef.current, "top-right");
        }

        map.on("draw.create", (e) => {
          const drawnPolygon = e.features[0];

          if (drawnPolygon.geometry.type === "Polygon") {
            const coordinates: [number, number][][] = drawnPolygon.geometry
              .coordinates as [number, number][][];

            setGeoJSONPolygon({
              type: "Polygon",
              coordinates: coordinates,
            });
            form.setValue("polygon", {
              type: "Polygon",
              coordinates: coordinates,
            });
            form.trigger("polygon"); // Trigger validation after setting the value
          }
        });

        // Set mode
        drawRef.current?.changeMode("draw_polygon");
      } else if (drawRef.current && map.hasControl(drawRef.current)) {
        // Remove control from the map
        map.removeControl(drawRef.current);
      }

      // Cleanup function
      return () => {
        if (drawRef.current && map.hasControl(drawRef.current)) {
          map.removeControl(drawRef.current);
        }
      };
    }
  }, [controlsVisible]);

  const handleDrawLocation = () => {
    setControlsVisible(true);
  };

  function onSubmit(data: z.infer<typeof FormSchema>) {
    handleSearch();
  }

  useEffect(() => {
    if (!!featureCollectionResponse) {
      mapRef.current?.easeTo({
        center: calculateBboxCenter(featureCollectionResponse.features[0].bbox), //drawCenter,
        zoom: 5,
        duration: 1000,
      });
    }
  }, [featureCollectionResponse]);

  useEffect(() => {
    if (!!date && !!date.from && !!date.to) {
      form.setValue("datetime", {
        from: date.from.toISOString().split("T")[0],
        to: date.to.toISOString().split("T")[0],
      });
      form.trigger("datetime"); // Trigger validation after setting the value
    }
  }, [date]);

  return (
    <main className="font-inter w-full h-full text-zinc-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
      >
        <Map
          ref={mapRef}
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          initialViewState={{
            longitude: 10,
            latitude: 10,
            zoom: 1.5,
          }}
          style={{ width: "100vw", height: "100vh" }}
          mapStyle="mapbox://styles/mapbox/dark-v11" //esfera
        >
          {!!featureCollectionResponse ? (
            <Source id="bboxes" type="geojson" data={featureCollectionResponse}>
              <Layer
                id="stac-layer"
                type="fill"
                paint={{
                  "fill-color": "#d946ef",
                  "fill-opacity": 0.4,
                }}
              />
              <Layer
                id="stac-layer-lines"
                type="line"
                paint={{
                  "line-color": "#d946ef",
                  "line-width": 1.3,
                }}
              />
            </Source>
          ) : null}

          <>
            {selectedFeatureInMap && isMapImageVisible && (
              <Source
                id={`raster-${selectedFeatureInMap.id}`}
                type="image"
                url={
                  selectedFeatureInMap.links.find(
                    (link) => link.rel === "thumbnail"
                  )?.href
                }
                coordinates={formatCoordinatesRasterImages(
                  selectedFeatureInMap.bbox
                )}
              >
                <Layer
                  source={`raster-${selectedFeatureInMap.id}`}
                  id={`image-${selectedFeatureInMap.id}`}
                  type="raster"
                  paint={{
                    "raster-fade-duration": 0,
                  }}
                />
              </Source>
            )}
          </>
        </Map>
      </motion.div>
      <motion.div
        className="absolute top-2 left-6 z-10 bg-zinc-900 p-6 mt-2 rounded-md overflow-y-scroll overflow-x-hidden"
        animate={{
          height: isMenuCollapsed
            ? "5.15rem"
            : isMenuExpanded
            ? "95vh"
            : "auto",
          width: isMenuExpanded ? "27.5vw" : "17vw",
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
        style={{ overflowY: isMenuCollapsed ? "hidden" : "scroll" }}
      >
        <div className="flex flex-row items-center justify-between pb-6 ">
          <h1 className="text-fuchsia-500 text-xl font-tektur  font-medium">
            Element 84's STAC API Earth{" "}
          </h1>
          {showResults ? (
            <div>
              <Button
                variant="ghost"
                className="hover:bg-zinc-700 hover:text-zinc-50"
                onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
              >
                <BsArrowsCollapse />
              </Button>
              <Button
                variant="ghost"
                className="hover:bg-zinc-700 hover:text-zinc-50 ml-2"
                onClick={() => {
                  setShowResults(false);
                  updateFeatureCollectionResponse(null);
                  setIsMenuExpanded(false);
                }}
              >
                <IoArrowBack />
              </Button>
            </div>
          ) : null}
        </div>

        {!!showResults ? (
          <div>
            <div className="flex flex-col gap-4 scroll">
              {features?.map((feature) => (
                <Card feature={feature} />
              ))}
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full  space-y-6"
            >
              <div className="flex flex-col gap-4 mt-4 ">
                <FormField
                  control={form.control}
                  name="collection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select a collection</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange;
                          setCollection(value);
                          form.setValue("collection", value);
                          form.trigger("collection");
                        }}
                        defaultValue={collection}
                      >
                        <FormControl>
                          <SelectTrigger className="text-center border-zinc-800 hover:border-fuchsia-500 bg-zinc-900 hover:bg-zinc-900 hover:text-zinc-50">
                            <SelectValue
                              className="text-center"
                              placeholder="Select a colection"
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="text-zinc-50 border-zinc-800  bg-zinc-900">
                          <SelectItem value="sentinel-1-grd">
                            Sentinel-1 Level-1C Ground Range Detected (GRD)
                          </SelectItem>
                          <SelectItem value="sentinel-2-c1-l2a">
                            Sentinel-2 Collection 1 Level-2A
                          </SelectItem>
                          <SelectItem value="sentinel-2-l1c">
                            Sentinel-2 Level-1C
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="polygon"
                  render={() => (
                    <FormItem>
                      <div className="flex flex-col justify-between gap-3">
                        <FormLabel>Search location</FormLabel>
                        <FormControl>
                          <Button
                            onClick={handleDrawLocation}
                            className="flex w-full items-center gap-1 border-zinc-800 hover:border-fuchsia-500 bg-zinc-900 hover:bg-zinc-900 hover:text-zinc-50"
                            variant="outline"
                          >
                            <RxCrosshair2 />
                            Draw location{" "}
                          </Button>
                        </FormControl>
                      </div>
                      <FormDescription>
                        Select the area on the map where you want to search.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="datetime"
                  render={({ field }) => (
                    <>
                      <FormLabel>Select your search dates</FormLabel>
                      <FormControl>
                        <DateRangePicker
                          className="w-full"
                          date={date}
                          setDate={(newDate) => {
                            setDate(newDate);
                            field.onChange(newDate);
                          }}
                        />
                      </FormControl>
                    </>
                  )}
                />
                <Button
                  type="submit"
                  className=" border-zinc-800 hover:border-fuchsia-500 hover:border-x-2  hover:border-y-2 bg-zinc-900 hover:bg-zinc-900 hover:text-zinc-50"
                  variant="outline"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </motion.div>
    </main>
  );
}

export default App;
