import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Global stub for app/components/icons/index.js which contains JSX in a .js
// file — vite:import-analysis cannot parse it without a mock in scope.
// Tests that need specific icon shapes can override with their own vi.mock call.
const Svg = (props) => null;
vi.mock("../app/components/icons/index.js", () => ({
  SearchIcon: Svg, CloseIcon: Svg, CheckIcon: Svg, ReplyIcon: Svg,
  ChatIcon: Svg, MapPinIcon: Svg, ArrowLeftIcon: Svg, TrashIcon: Svg,
  DownloadIcon: Svg, ShareIcon: Svg, SettingsIcon: Svg, UserIcon: Svg,
  MailIcon: Svg, LockIcon: Svg, ShieldIcon: Svg, HomeIcon: Svg,
  PhoneIcon: Svg, GlobeIcon: Svg, ChevronDownIcon: Svg, EyeIcon: Svg,
  EyeOffIcon: Svg, BuildingIcon: Svg, PlusIcon: Svg, CalendarIcon: Svg,
  StarIcon: Svg, PlaneIcon: Svg, HotelIcon: Svg, ForkKnifeIcon: Svg,
  CarIcon: Svg, ListIcon: Svg, MapIcon: Svg, SparkleIcon: Svg,
  UsersIcon: Svg, UserGroupIcon: Svg, ZapIcon: Svg, CommentIcon: Svg,
  BookmarkIcon: Svg, LinkIcon: Svg, RefreshIcon: Svg, CheckCircleIcon: Svg,
  ChevronLeftIcon: Svg, ArrowRightIcon: Svg, PresenterIcon: Svg, SortIcon: Svg,
}));

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => {};
}

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

afterEach(() => {
  cleanup();
});
