from urllib import parse

from rest_framework.pagination import LimitOffsetPagination


# Copied from https://gitlab.com/thorgate/d7_chat_prototype/blob/master/d7_chat_prototype/chat/rest/pagination.py
class PaginationModeMixin:
    # This is a helper Mixin that allows to send pagination data in form of json-serialized get parameters ready to
    # be provided to API url resolver on js side, instead of returning a link 'complied' into a string.

    pagination_mode_url_kwarg = "pagination_mode"

    PAGINATION_MODE_LINK = "link"
    PAGINATION_MODE_KWARGS = "kwargs"

    PAGINATION_DEFAULT = PAGINATION_MODE_KWARGS

    def paginate_queryset(self, queryset, request, view=None):
        self.pagination_mode = self.get_pagination_mode(request)
        return super().paginate_queryset(queryset, request, view=view)

    def get_pagination_mode(self, request):
        return parse.unquote(
            request.GET.get(self.pagination_mode_url_kwarg, self.PAGINATION_DEFAULT)
        )

    def get_link(self, url, mode_override=None):
        pagination_mode = (
            self.pagination_mode if mode_override is None else mode_override
        )
        if pagination_mode == self.PAGINATION_MODE_LINK:
            return url

        parsed = parse.urlsplit(url)
        if not parsed.path:
            return None

        result = parse.parse_qs(parsed.query, keep_blank_values=True)

        return {
            key: value if len(value) > 1 else value[0] for key, value in result.items()
        }

    def get_next_link(self, mode_override=None):
        return self.get_link(super().get_next_link(), mode_override=mode_override)

    def get_previous_link(self, mode_override=None):
        return self.get_link(super().get_previous_link(), mode_override=mode_override)

    def get_html_context(self):
        context = super().get_html_context()
        context.update(
            {
                "previous_url": self.get_previous_link(
                    mode_override=self.PAGINATION_MODE_LINK
                ),
                "next_url": self.get_next_link(mode_override=self.PAGINATION_MODE_LINK),
            }
        )
        return context


class SpaPagination(PaginationModeMixin, LimitOffsetPagination):
    pass
