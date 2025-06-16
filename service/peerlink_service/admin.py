from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count
from .models import User, Report, Shared

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'date_joined')
    search_fields = ('username', 'email')
    readonly_fields = ('id', 'date_joined')

@admin.register(Shared)
class SharedAdmin(admin.ModelAdmin):
    list_display = ('file_hash', 'file_name', 'magnetLink')
    search_fields = ('file_hash', 'file_name')
    readonly_fields = ('file_hash', 'file_name', 'magnetLink')

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'file_link', 'reporter_link', 'status', 'created_at', 'admin_notes_preview', 'quick_actions')
    list_filter = ('status', 'created_at', 'reporter')
    search_fields = ('file__file_name', 'reporter__username', 'reason', 'admin_notes')
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 20
    actions = ['approve_reports', 'reject_reports']
    date_hierarchy = 'created_at'
    
    def file_link(self, obj):
        url = reverse('admin:peerlink_service_shared_change', args=[obj.file.file_hash])
        return format_html('<a href="{}">{}</a>', url, obj.file.file_name)
    file_link.short_description = 'Reported File'
    
    def reporter_link(self, obj):
        url = reverse('admin:peerlink_service_user_change', args=[obj.reporter.id])
        return format_html('<a href="{}">{}</a>', url, obj.reporter.username)
    reporter_link.short_description = 'Reporter'
    
    def admin_notes_preview(self, obj):
        if obj.admin_notes:
            return format_html('<span title="{}">{}</span>', 
                             obj.admin_notes, 
                             obj.admin_notes[:50] + '...' if len(obj.admin_notes) > 50 else obj.admin_notes)
        return '-'
    admin_notes_preview.short_description = 'Admin Notes'
    
    def quick_actions(self, obj):
        if obj.status == 'PENDING':
            approve_url = reverse('admin:peerlink_service_report_approve', args=[obj.id])
            reject_url = reverse('admin:peerlink_service_report_reject', args=[obj.id])
            return format_html(
                '<a class="button" href="{}">Approve</a>&nbsp;'
                '<a class="button" href="{}">Reject</a>',
                approve_url, reject_url
            )
        return '-'
    quick_actions.short_description = 'Actions'
    
    def approve_reports(self, request, queryset):
        queryset.update(status='APPROVED')
        for report in queryset:
            report.file.delete()
    approve_reports.short_description = 'Approve selected reports and delete files'
    
    def reject_reports(self, request, queryset):
        queryset.update(status='REJECTED')
    reject_reports.short_description = 'Reject selected reports'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('file', 'reporter')
    
    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:report_id>/approve/',
                self.admin_site.admin_view(self.approve_report),
                name='peerlink_service_report_approve',
            ),
            path(
                '<int:report_id>/reject/',
                self.admin_site.admin_view(self.reject_report),
                name='peerlink_service_report_reject',
            ),
        ]
        return custom_urls + urls
    
    def approve_report(self, request, report_id):
        report = Report.objects.get(id=report_id)
        report.status = 'APPROVED'
        report.save()
        report.file.delete()
        self.message_user(request, f'Report #{report_id} approved and file deleted.')
        return self.response_post_save_change(request, report)
    
    def reject_report(self, request, report_id):
        report = Report.objects.get(id=report_id)
        report.status = 'REJECTED'
        report.save()
        self.message_user(request, f'Report #{report_id} rejected.')
        return self.response_post_save_change(request, report)
    
    class Media:
        css = {
            'all': ('admin/css/report_admin.css',)
        }
