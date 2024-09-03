import CardItem from "./CardItem";
import { Button } from "@/components/ui/button";
import { IoArrowForward } from "react-icons/io5";
import { LuMapPin } from "react-icons/lu";
import { PiImageBrokenDuotone } from "react-icons/pi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { IoInformationCircleOutline } from "react-icons/io5";
import {
  featurePropertiesCard,
  featuresModal,
  formatValue,
} from "./propertiesFormats";
import useSTACStore from "@/stores/stacStore";

interface STACFeature {
  type: "Feature";
  stac_version: string;
  id: string;
  properties: {};
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  links: {
    rel: string;
    type: string;
    href: string;
    title?: string;
  }[];
  assets: {
    [key: string]: {
      href: string;
      type: string;
      title?: string;
    };
  };
  bbox: [number, number, number, number];
  stac_extensions: string[];
  collection: string;
}

interface CardProps {
  feature: STACFeature;
}

const Card = ({ feature }: { feature: any }) => {
  const [isImageBroken, setIsImageBroken] = useState(false);
  const {
    selectedFeatureInMap,
    updateSelectedFeatureInMap,
    isMapImageVisible,
  } = useSTACStore();

  const handleImageError = () => {
    setIsImageBroken(true);
  };

  const handleMapImageButtonClick = () => {
    if (selectedFeatureInMap?.id === feature.id && isMapImageVisible) {
      updateSelectedFeatureInMap(null);
    } else {
      updateSelectedFeatureInMap(feature);
    }
  };

  return (
    <div className="bg-zinc-950 rounded-md p-4 flex flex-col text-sm gap-4">
      <div className="flex items-center justify-between h-[12vh]">
        <div className="flex flex-col gap-2 h-auto mr-4">
          {featurePropertiesCard.map((elem) => (
            <CardItem
              property={elem.property}
              itemName={elem.name}
              itemDescription={elem.info}
              value={feature.properties[elem.property]}
            />
          ))}
          {feature.properties["sar:resolution_range"] &&
          feature.properties["s1:resolution"] ? (
            <CardItem
              property={feature.properties["s1:resolution"]}
              itemName="Resolution"
              itemDescription="The resolution of the data"
              value={`${feature.properties["sar:resolution_range"]} - ${feature.properties["s1:resolution"]}`}
            />
          ) : null}
        </div>
        {isImageBroken ? (
          <div className="flex items-center justify-center h-fit text-3xl text-gray-500">
            <PiImageBrokenDuotone size={125} />
          </div>
        ) : (
          <img
            className="max-w-28 h-fit"
            src={
              feature.links.find((link: any) => link.rel === "thumbnail")?.href
            }
            alt="Thumbnail"
            onError={handleImageError}
          ></img>
        )}
      </div>
      <div className="flex flex-row justify-between gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className=" flex flex-row gap-4 bg-zinc-900 hover:bg-zinc-950 hover:text-fuchsia-400  text-zinc-50"
              variant="ghost"
            >
              More info <IoArrowForward />
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-zinc-950 border-zinc-800 w-80 sm:w-full  sm:max-w-[60vw] text-zinc-300">
            <DialogHeader>
              <DialogTitle className="">
                Item's aditional information
              </DialogTitle>
              <DialogDescription className="text-md text-zinc-300 p-4">
                <>
                  <div className="flex py-2 justify-between items-start">
                    <div className="flex flex-col gap-2 mr-4">
                      <p>ID: {feature.id}</p>
                      {featuresModal.map((elem) => {
                        return !!feature.properties[elem.property] ? (
                          <div className="flex flex-row ">
                            <span className="flex flex-row items-center gap-1">
                              <p>{elem.name}</p>
                              <TooltipProvider>
                                <Tooltip
                                  //@ts-ignore
                                  defaultOpen="false"
                                >
                                  <TooltipTrigger>
                                    <IoInformationCircleOutline className="rounded-sm  w-4 h-4 hover:bg-zinc-700" />
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-950">
                                    <p className="max-w-48">{elem.info}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>{" "}
                              :{" "}
                            </span>
                            <p>
                              {formatValue(feature.properties[elem.property])}
                            </p>
                          </div>
                        ) : null;
                      })}
                    </div>
                    {isImageBroken ? (
                      <div className="flex items-center justify-center h-fit text-3xl text-gray-500">
                        <PiImageBrokenDuotone size={300} />
                      </div>
                    ) : (
                      <img
                        className="max-w-96 h-fit"
                        src={
                          feature.links.find(
                            (link: any) => link.rel === "thumbnail"
                          )?.href
                        }
                        alt="Thumbnail"
                        onError={handleImageError}
                      ></img>
                    )}
                  </div>
                  <h1> Downloads</h1>
                  <div className="flex flex-row gap-4 mt-4">
                    <Button asChild disabled={isImageBroken}>
                      {isImageBroken ? null : (
                        <a
                          href={
                            feature.links.find(
                              (link: any) => link.rel === "thumbnail"
                            )?.href
                          }
                          target="_blank"
                        >
                          Thumbnail image
                        </a>
                      )}
                    </Button>
                    <Button asChild>
                      <a
                        href={
                          feature.links.find((link: any) => link.rel === "self")
                            ?.href
                        }
                        target="_blank"
                      >
                        API / GeoJSON
                      </a>
                    </Button>
                  </div>
                </>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {isImageBroken ? null : (
          <Button
            className=" flex flex-row gap-4 bg-zinc-900 hover:bg-zinc-950 hover:text-fuchsia-400  text-zinc-50"
            variant="ghost"
            onClick={handleMapImageButtonClick}
          >
            {selectedFeatureInMap?.id === feature.id && isMapImageVisible
              ? "Hide image in map"
              : "Show image in map"}{" "}
            <LuMapPin />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Card;
