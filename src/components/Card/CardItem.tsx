import { IoInformationCircleOutline } from "react-icons/io5";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatValue } from "./propertiesFormats";

interface CardItemProps {
  property: string | number | undefined;
  itemName: string;
  itemDescription?: string;
  value: string | number | undefined;
}

const CardItem = ({
  property,
  itemName,
  itemDescription,
  value,
}: CardItemProps) => {
  return !!property && !!value ? (
    <div className="flex flex-row gap-2">
      <div className="flex flex-row gap-1 items-center justify-center">
        <p> {itemName}</p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <IoInformationCircleOutline />
            </TooltipTrigger>
            <TooltipContent
              //side="left"
              className="bg-zinc-900 text-zinc-50 border-zinc-950"
            >
              <p>{itemDescription}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <p>{formatValue(value)}</p>
    </div>
  ) : null;
};

export default CardItem;
