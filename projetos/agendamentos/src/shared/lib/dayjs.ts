import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import "dayjs/locale/en";
import "dayjs/locale/es";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(isoWeek);

export { dayjs };
