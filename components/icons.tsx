/**
 * Every icon in the app, from Phosphor Icons, as the Foren Design System requires
 * ("All icons use Phosphor Icons. No custom SVGs, no other icon sets": Figma fMjvoaNbmk0lqhd9hatUEa · 159:2).
 * Weights follow the DS: Regular for most UI, Bold for emphasis and small glyphs (ticks, plus, drag handles),
 * Fill for selected, status and solid states. Size with Tailwind (`size-4` = 16px, `size-5` = 20px, `size-6` = 24px);
 * colour comes from `currentColor`, so set it with text tokens.
 * Imported from the SSR entry so server and client components can both use them.
 */
import * as React from "react";
import type { Icon, IconProps, IconWeight } from "@phosphor-icons/react";
import {
  AirplaneIcon as PhAirplane,
  AppleLogoIcon as PhAppleLogo,
  ArchiveIcon as PhArchive,
  ArrowCircleUpIcon as PhArrowCircleUp,
  ArrowClockwiseIcon as PhArrowClockwise,
  ArrowDownIcon as PhArrowDown,
  ArrowDownRightIcon as PhArrowDownRight,
  ArrowLeftIcon as PhArrowLeft,
  ArrowRightIcon as PhArrowRight,
  ArrowUpIcon as PhArrowUp,
  ArrowUpRightIcon as PhArrowUpRight,
  ArrowsDownUpIcon as PhArrowsDownUp,
  ArrowsLeftRightIcon as PhArrowsLeftRight,
  AsteriskIcon as PhAsterisk,
  BellIcon as PhBell,
  BinocularsIcon as PhBinoculars,
  BuildingsIcon as PhBuildings,
  CalendarBlankIcon as PhCalendarBlank,
  CameraIcon as PhCamera,
  CaretDownIcon as PhCaretDown,
  CaretLeftIcon as PhCaretLeft,
  CaretRightIcon as PhCaretRight,
  CaretUpDownIcon as PhCaretUpDown,
  CaretUpIcon as PhCaretUp,
  ChartLineIcon as PhChartLine,
  ChatCircleIcon as PhChatCircle,
  ChatTextIcon as PhChatText,
  ChatsIcon as PhChats,
  CheckIcon as PhCheck,
  CheckCircleIcon as PhCheckCircle,
  ClipboardTextIcon as PhClipboardText,
  ClockIcon as PhClock,
  ClockCounterClockwiseIcon as PhClockCounterClockwise,
  CloudArrowUpIcon as PhCloudArrowUp,
  CoinIcon as PhCoin,
  CopyIcon as PhCopy,
  CreditCardIcon as PhCreditCard,
  CurrencyCircleDollarIcon as PhCurrencyCircleDollar,
  DotsSixVerticalIcon as PhDotsSixVertical,
  DotsThreeVerticalIcon as PhDotsThreeVertical,
  DownloadSimpleIcon as PhDownloadSimple,
  EnvelopeSimpleIcon as PhEnvelopeSimple,
  EyeIcon as PhEye,
  EyeClosedIcon as PhEyeClosed,
  EyeSlashIcon as PhEyeSlash,
  FileIcon as PhFile,
  FileImageIcon as PhFileImage,
  FilePdfIcon as PhFilePdf,
  FileTextIcon as PhFileText,
  FlaskIcon as PhFlask,
  FloppyDiskIcon as PhFloppyDisk,
  FunnelSimpleIcon as PhFunnelSimple,
  GearIcon as PhGear,
  GearFineIcon as PhGearFine,
  GearSixIcon as PhGearSix,
  GlobeIcon as PhGlobe,
  GoogleLogoIcon as PhGoogleLogo,
  HouseIcon as PhHouse,
  IdentificationCardIcon as PhIdentificationCard,
  ImageSquareIcon as PhImageSquare,
  InfoIcon as PhInfo,
  KeyIcon as PhKey,
  LightbulbIcon as PhLightbulb,
  LightningIcon as PhLightning,
  ListIcon as PhList,
  LockIcon as PhLock,
  LockOpenIcon as PhLockOpen,
  MagnifyingGlassIcon as PhMagnifyingGlass,
  MinusIcon as PhMinus,
  NotePencilIcon as PhNotePencil,
  PaperPlaneTiltIcon as PhPaperPlaneTilt,
  PathIcon as PhPath,
  PencilSimpleIcon as PhPencilSimple,
  PlayIcon as PhPlay,
  PlayCircleIcon as PhPlayCircle,
  PlusIcon as PhPlus,
  ProhibitIcon as PhProhibit,
  QuestionIcon as PhQuestion,
  ReceiptIcon as PhReceipt,
  RepeatIcon as PhRepeat,
  ScalesIcon as PhScales,
  ShieldIcon as PhShield,
  ShieldCheckIcon as PhShieldCheck,
  ShoppingBagIcon as PhShoppingBag,
  SirenIcon as PhSiren,
  SnowflakeIcon as PhSnowflake,
  SparkleIcon as PhSparkle,
  SquaresFourIcon as PhSquaresFour,
  StarIcon as PhStar,
  StorefrontIcon as PhStorefront,
  TrashIcon as PhTrash,
  TrayIcon as PhTray,
  UploadSimpleIcon as PhUploadSimple,
  UserIcon as PhUser,
  UserGearIcon as PhUserGear,
  UserMinusIcon as PhUserMinus,
  UsersThreeIcon as PhUsersThree,
  WalletIcon as PhWallet,
  WarningIcon as PhWarning,
  WarningCircleIcon as PhWarningCircle,
  WhatsappLogoIcon as PhWhatsappLogo,
  XIcon as PhX,
  XCircleIcon as PhXCircle,
} from "@phosphor-icons/react/dist/ssr";

export type IconComponent = React.ComponentType<IconProps>;

function weighted(Base: Icon, weight: IconWeight, name: string): IconComponent {
  const C = React.forwardRef<SVGSVGElement, IconProps>(function WeightedIcon(props, ref) {
    return <Base ref={ref} weight={weight} {...props} />;
  });
  C.displayName = name;
  return C;
}

export const AirplaneIcon: IconComponent = PhAirplane;
export const AppleLogoFillIcon = weighted(PhAppleLogo, "fill", "AppleLogoFillIcon");
export const ArchiveIcon: IconComponent = PhArchive;
export const ArrowCircleUpIcon: IconComponent = PhArrowCircleUp;
export const ArrowClockwiseIcon: IconComponent = PhArrowClockwise;
export const ArrowDownIcon: IconComponent = PhArrowDown;
export const ArrowDownRightIcon: IconComponent = PhArrowDownRight;
export const ArrowLeftIcon: IconComponent = PhArrowLeft;
export const ArrowRightIcon: IconComponent = PhArrowRight;
export const ArrowUpIcon: IconComponent = PhArrowUp;
export const ArrowUpRightIcon: IconComponent = PhArrowUpRight;
export const ArrowsDownUpIcon: IconComponent = PhArrowsDownUp;
export const ArrowsLeftRightBoldIcon = weighted(PhArrowsLeftRight, "bold", "ArrowsLeftRightBoldIcon");
export const ArrowsLeftRightIcon: IconComponent = PhArrowsLeftRight;
export const AsteriskBoldIcon = weighted(PhAsterisk, "bold", "AsteriskBoldIcon");
export const BellIcon: IconComponent = PhBell;
export const BinocularsIcon: IconComponent = PhBinoculars;
export const BuildingsIcon: IconComponent = PhBuildings;
export const CalendarBlankIcon: IconComponent = PhCalendarBlank;
export const CameraIcon: IconComponent = PhCamera;
export const CaretDownIcon: IconComponent = PhCaretDown;
export const CaretLeftIcon: IconComponent = PhCaretLeft;
export const CaretRightIcon: IconComponent = PhCaretRight;
export const CaretUpDownIcon: IconComponent = PhCaretUpDown;
export const CaretUpIcon: IconComponent = PhCaretUp;
export const ChartLineIcon: IconComponent = PhChartLine;
export const ChatCircleIcon: IconComponent = PhChatCircle;
export const ChatTextIcon: IconComponent = PhChatText;
export const ChatsFillIcon = weighted(PhChats, "fill", "ChatsFillIcon");
export const ChatsIcon: IconComponent = PhChats;
export const CheckBoldIcon = weighted(PhCheck, "bold", "CheckBoldIcon");
export const CheckCircleFillIcon = weighted(PhCheckCircle, "fill", "CheckCircleFillIcon");
export const CheckCircleIcon: IconComponent = PhCheckCircle;
export const ClipboardTextIcon: IconComponent = PhClipboardText;
export const ClockFillIcon = weighted(PhClock, "fill", "ClockFillIcon");
export const ClockIcon: IconComponent = PhClock;
export const ClockCounterClockwiseFillIcon = weighted(PhClockCounterClockwise, "fill", "ClockCounterClockwiseFillIcon");
export const ClockCounterClockwiseIcon: IconComponent = PhClockCounterClockwise;
export const CloudArrowUpIcon: IconComponent = PhCloudArrowUp;
export const CoinIcon: IconComponent = PhCoin;
export const CopyIcon: IconComponent = PhCopy;
export const CreditCardIcon: IconComponent = PhCreditCard;
export const CurrencyCircleDollarIcon: IconComponent = PhCurrencyCircleDollar;
export const DotsSixVerticalBoldIcon = weighted(PhDotsSixVertical, "bold", "DotsSixVerticalBoldIcon");
export const DotsThreeVerticalBoldIcon = weighted(PhDotsThreeVertical, "bold", "DotsThreeVerticalBoldIcon");
export const DownloadSimpleIcon: IconComponent = PhDownloadSimple;
export const EnvelopeSimpleIcon: IconComponent = PhEnvelopeSimple;
export const EyeIcon: IconComponent = PhEye;
export const EyeClosedIcon: IconComponent = PhEyeClosed;
export const EyeSlashIcon: IconComponent = PhEyeSlash;
export const FileFillIcon = weighted(PhFile, "fill", "FileFillIcon");
export const FileIcon: IconComponent = PhFile;
export const FileImageFillIcon = weighted(PhFileImage, "fill", "FileImageFillIcon");
export const FilePdfFillIcon = weighted(PhFilePdf, "fill", "FilePdfFillIcon");
export const FileTextIcon: IconComponent = PhFileText;
export const FlaskIcon: IconComponent = PhFlask;
export const FloppyDiskIcon: IconComponent = PhFloppyDisk;
export const FunnelSimpleIcon: IconComponent = PhFunnelSimple;
export const GearFillIcon = weighted(PhGear, "fill", "GearFillIcon");
export const GearFineIcon: IconComponent = PhGearFine;
export const GearSixIcon: IconComponent = PhGearSix;
export const GlobeIcon: IconComponent = PhGlobe;
export const GoogleLogoBoldIcon = weighted(PhGoogleLogo, "bold", "GoogleLogoBoldIcon");
export const HouseIcon: IconComponent = PhHouse;
export const IdentificationCardIcon: IconComponent = PhIdentificationCard;
export const ImageSquareIcon: IconComponent = PhImageSquare;
export const InfoFillIcon = weighted(PhInfo, "fill", "InfoFillIcon");
export const InfoIcon: IconComponent = PhInfo;
export const KeyIcon: IconComponent = PhKey;
export const LightbulbIcon: IconComponent = PhLightbulb;
export const LightningIcon: IconComponent = PhLightning;
export const ListIcon: IconComponent = PhList;
export const LockIcon: IconComponent = PhLock;
export const LockOpenIcon: IconComponent = PhLockOpen;
export const MagnifyingGlassIcon: IconComponent = PhMagnifyingGlass;
export const MinusIcon: IconComponent = PhMinus;
export const NotePencilIcon: IconComponent = PhNotePencil;
export const PaperPlaneTiltIcon: IconComponent = PhPaperPlaneTilt;
export const PathIcon: IconComponent = PhPath;
export const PencilSimpleIcon: IconComponent = PhPencilSimple;
export const PlayIcon: IconComponent = PhPlay;
export const PlayCircleIcon: IconComponent = PhPlayCircle;
export const PlusBoldIcon = weighted(PhPlus, "bold", "PlusBoldIcon");
export const PlusIcon: IconComponent = PhPlus;
export const ProhibitIcon: IconComponent = PhProhibit;
export const QuestionFillIcon = weighted(PhQuestion, "fill", "QuestionFillIcon");
export const QuestionIcon: IconComponent = PhQuestion;
export const ReceiptIcon: IconComponent = PhReceipt;
export const RepeatIcon: IconComponent = PhRepeat;
export const ScalesIcon: IconComponent = PhScales;
export const ShieldFillIcon = weighted(PhShield, "fill", "ShieldFillIcon");
export const ShieldIcon: IconComponent = PhShield;
export const ShieldCheckFillIcon = weighted(PhShieldCheck, "fill", "ShieldCheckFillIcon");
export const ShieldCheckIcon: IconComponent = PhShieldCheck;
export const ShoppingBagIcon: IconComponent = PhShoppingBag;
export const SirenIcon: IconComponent = PhSiren;
export const SnowflakeIcon: IconComponent = PhSnowflake;
export const SparkleIcon: IconComponent = PhSparkle;
export const SquaresFourIcon: IconComponent = PhSquaresFour;
export const StarIcon: IconComponent = PhStar;
export const StorefrontIcon: IconComponent = PhStorefront;
export const TrashIcon: IconComponent = PhTrash;
export const TrayIcon: IconComponent = PhTray;
export const UploadSimpleIcon: IconComponent = PhUploadSimple;
export const UserIcon: IconComponent = PhUser;
export const UserGearIcon: IconComponent = PhUserGear;
export const UserMinusIcon: IconComponent = PhUserMinus;
export const UsersThreeFillIcon = weighted(PhUsersThree, "fill", "UsersThreeFillIcon");
export const UsersThreeIcon: IconComponent = PhUsersThree;
export const WalletIcon: IconComponent = PhWallet;
export const WarningFillIcon = weighted(PhWarning, "fill", "WarningFillIcon");
export const WarningIcon: IconComponent = PhWarning;
export const WarningCircleFillIcon = weighted(PhWarningCircle, "fill", "WarningCircleFillIcon");
export const WarningCircleIcon: IconComponent = PhWarningCircle;
export const WhatsappLogoIcon: IconComponent = PhWhatsappLogo;
export const XIcon: IconComponent = PhX;
export const XCircleFillIcon = weighted(PhXCircle, "fill", "XCircleFillIcon");
export const XCircleIcon: IconComponent = PhXCircle;
