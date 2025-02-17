import * as blueslip from "./blueslip";
import {Filter} from "./filter";
import type {Term} from "./filter";
import * as inbox_util from "./inbox_util";
import {page_params} from "./page_params";
import * as people from "./people";
import * as recent_view_util from "./recent_view_util";
import * as stream_data from "./stream_data";
import type {StreamSubscription} from "./sub_store";
import * as unread from "./unread";

let current_filter: Filter | undefined;

export let has_shown_message_list_view = false;

export function reset_current_filter(): void {
    current_filter = undefined;
}

export function set_current_filter(filter: Filter | undefined): void {
    current_filter = filter;
}

export function active(): boolean {
    return current_filter !== undefined;
}

export function filter(): Filter | undefined {
    // Both, `All messages` and
    // `Recent Conversations` have `current_filter=undefined`
    return current_filter;
}

export function search_terms(): Term[] {
    if (current_filter === undefined) {
        if (page_params.narrow !== undefined) {
            return new Filter(page_params.narrow).terms();
        }
        return new Filter([]).terms();
    }
    return current_filter.terms();
}

export function is_message_feed_visible(): boolean {
    return !recent_view_util.is_visible() && !inbox_util.is_visible();
}

export function update_email(user_id: number, new_email: string): void {
    if (current_filter !== undefined) {
        current_filter.update_email(user_id, new_email);
    }
}

/* Search terms we should send to the server. */
export function public_search_terms(): Term[] | undefined {
    if (current_filter === undefined) {
        return undefined;
    }
    return current_filter.public_terms();
}

export function search_string(): string {
    return Filter.unparse(search_terms());
}

// Collect terms which appear only once into an object,
// and discard those which appear more than once.
function collect_single(terms: Term[]): Map<string, string> {
    const seen = new Map();
    const result = new Map();

    for (const term of terms) {
        const key = term.operator;
        if (seen.has(key)) {
            result.delete(key);
        } else {
            result.set(key, term.operand);
            seen.set(key, true);
        }
    }

    return result;
}

// Modify default compose parameters (stream etc.) based on
// the current narrowed view.
//
// This logic is here and not in the 'compose' module because
// it will get more complicated as we add things to the narrow
// search term language.
export function set_compose_defaults(): {
    stream_id?: number;
    topic?: string;
    private_message_recipient?: string;
} {
    const opts: {stream_id?: number; topic?: string; private_message_recipient?: string} = {};
    const single = collect_single(search_terms());

    // Set the stream, topic, and/or direct message recipient
    // if they are uniquely specified in the narrow view.

    if (single.has("stream")) {
        // The raw stream name from collect_single may be an arbitrary
        // unvalidated string from the URL fragment and thus not be valid.
        // So we look up the resolved stream and return that if appropriate.
        const sub = stream_sub();
        if (sub !== undefined) {
            opts.stream_id = sub.stream_id;
        }
    }

    if (single.has("topic")) {
        opts.topic = single.get("topic");
    }

    const private_message_recipient = single.get("dm");
    if (
        private_message_recipient !== undefined &&
        people.is_valid_bulk_emails_for_compose(private_message_recipient.split(","))
    ) {
        opts.private_message_recipient = private_message_recipient;
    }
    return opts;
}

export function stream_name(): string | undefined {
    if (current_filter === undefined) {
        return undefined;
    }
    const stream_operands = current_filter.operands("stream");
    if (stream_operands.length === 1) {
        const name = stream_operands[0];

        // Use get_name() to get the most current stream
        // name (considering renames and capitalization).
        return stream_data.get_name(name);
    }
    return undefined;
}

export function stream_sub(): StreamSubscription | undefined {
    if (current_filter === undefined) {
        return undefined;
    }
    const stream_operands = current_filter.operands("stream");
    if (stream_operands.length !== 1) {
        return undefined;
    }

    const name = stream_operands[0];
    const sub = stream_data.get_sub_by_name(name);

    return sub;
}

export function stream_id(): number | undefined {
    const sub = stream_sub();
    if (sub === undefined) {
        return undefined;
    }
    return sub.stream_id;
}

export function topic(): string | undefined {
    if (current_filter === undefined) {
        return undefined;
    }
    const operands = current_filter.operands("topic");
    if (operands.length === 1) {
        return operands[0];
    }
    return undefined;
}

export function pm_ids_string(): string | undefined {
    // If you are narrowed to a group direct message with
    // users 4, 5, and 99, this will return "4,5,99"
    const emails_string = pm_emails_string();

    if (!emails_string) {
        return undefined;
    }

    const user_ids_string = people.reply_to_to_user_ids_string(emails_string);

    return user_ids_string;
}

export function pm_ids_set(): Set<number> {
    const ids_string = pm_ids_string();
    const pm_ids_list = ids_string ? people.user_ids_string_to_ids_array(ids_string) : [];
    return new Set(pm_ids_list);
}

export function pm_emails_string(): string | undefined {
    if (current_filter === undefined) {
        return undefined;
    }

    const operands = current_filter.operands("dm");
    if (operands.length !== 1) {
        return undefined;
    }

    return operands[0];
}

export function get_first_unread_info():
    | {flavor: "cannot_compute" | "not_found"}
    | {flavor: "found"; msg_id: number} {
    if (current_filter === undefined) {
        // we don't yet support the all-messages view
        blueslip.error("unexpected call to get_first_unread_info");
        return {
            flavor: "cannot_compute",
        };
    }

    if (!current_filter.can_apply_locally()) {
        // For things like search queries, where the server has info
        // that the client isn't privy to, we need to wait for the
        // server to give us a definitive list of messages before
        // deciding where we'll move the selection.
        return {
            flavor: "cannot_compute",
        };
    }

    const unread_ids = _possible_unread_message_ids();

    if (unread_ids === undefined) {
        // _possible_unread_message_ids() only works for certain narrows
        return {
            flavor: "cannot_compute",
        };
    }

    const msg_id = current_filter.first_valid_id_from(unread_ids);

    if (msg_id === undefined) {
        return {
            flavor: "not_found",
        };
    }

    return {
        flavor: "found",
        msg_id: unread_ids[0],
    };
}

export function _possible_unread_message_ids(): number[] | undefined {
    // This function currently only returns valid results for
    // certain types of narrows, mostly left sidebar narrows.
    // For more complicated narrows we may return undefined.
    //
    // If we do return a result, it will be a subset of unread
    // message ids but possibly a superset of unread message ids
    // that match our filter.
    if (current_filter === undefined) {
        return undefined;
    }

    let sub;
    let topic_name;
    let current_filter_pm_string;

    if (current_filter.can_bucket_by("stream", "topic")) {
        sub = stream_sub();
        topic_name = topic();
        if (sub === undefined || topic_name === undefined) {
            return [];
        }
        return unread.get_msg_ids_for_topic(sub.stream_id, topic_name);
    }

    if (current_filter.can_bucket_by("stream")) {
        sub = stream_sub();
        if (sub === undefined) {
            return [];
        }
        return unread.get_msg_ids_for_stream(sub.stream_id);
    }

    if (current_filter.can_bucket_by("dm")) {
        current_filter_pm_string = pm_ids_string();
        if (current_filter_pm_string === undefined) {
            return [];
        }
        return unread.get_msg_ids_for_user_ids_string(current_filter_pm_string);
    }

    if (current_filter.can_bucket_by("is-dm")) {
        return unread.get_msg_ids_for_private();
    }

    if (current_filter.can_bucket_by("is-mentioned")) {
        return unread.get_msg_ids_for_mentions();
    }

    if (current_filter.can_bucket_by("is-starred")) {
        return unread.get_msg_ids_for_starred();
    }

    if (current_filter.can_bucket_by("sender")) {
        // TODO: see #9352 to make this more efficient
        return unread.get_all_msg_ids();
    }

    if (current_filter.can_apply_locally()) {
        return unread.get_all_msg_ids();
    }

    return undefined;
}

// Are we narrowed to direct messages: all direct messages
// or direct messages with particular people.
export function narrowed_to_pms(): boolean {
    if (current_filter === undefined) {
        return false;
    }
    return current_filter.has_operator("dm") || current_filter.has_operand("is", "dm");
}

export function narrowed_by_pm_reply(): boolean {
    if (current_filter === undefined) {
        return false;
    }
    const terms = current_filter.terms();
    return terms.length === 1 && current_filter.has_operator("dm");
}

export function narrowed_by_topic_reply(): boolean {
    if (current_filter === undefined) {
        return false;
    }
    const terms = current_filter.terms();
    return (
        terms.length === 2 &&
        current_filter.operands("stream").length === 1 &&
        current_filter.operands("topic").length === 1
    );
}

// We auto-reply under certain conditions, namely when you're narrowed
// to a 1:1 or group direct message conversation, and when you're
// narrowed to some stream/topic pair.
export function narrowed_by_reply(): boolean {
    return narrowed_by_pm_reply() || narrowed_by_topic_reply();
}

export function narrowed_by_stream_reply(): boolean {
    if (current_filter === undefined) {
        return false;
    }
    const terms = current_filter.terms();
    return terms.length === 1 && current_filter.operands("stream").length === 1;
}

export function narrowed_to_topic(): boolean {
    if (current_filter === undefined) {
        return false;
    }
    return current_filter.has_operator("stream") && current_filter.has_operator("topic");
}

export function narrowed_to_search(): boolean {
    return current_filter !== undefined && current_filter.is_keyword_search();
}

export function narrowed_to_starred(): boolean {
    if (current_filter === undefined) {
        return false;
    }
    return current_filter.has_operand("is", "starred");
}

export function excludes_muted_topics(): boolean {
    return (
        !narrowed_to_topic() &&
        !narrowed_to_search() &&
        !narrowed_to_pms() &&
        !narrowed_to_starred()
    );
}

export function is_for_stream_id(stream_id: number): boolean {
    // This is not perfect, since we still track narrows by
    // name, not id, but at least the interface is good going
    // forward.
    const narrow_sub = stream_sub();

    if (narrow_sub === undefined) {
        return false;
    }

    return stream_id === narrow_sub.stream_id;
}

export function set_has_shown_message_list_view(): void {
    has_shown_message_list_view = true;
}
