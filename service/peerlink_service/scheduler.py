from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
from django_apscheduler.jobstores import DjangoJobStore
from .tasks import notify_users

def start():
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")

    scheduler.add_job(
        notify_users,
        'interval',
        minutes=1,
        id='notification_job',
        replace_existing=True,
    )

    scheduler.start()

    def job_listener(event):
        if event.exception:
            print(f"Job {event.job_id} failed.")
        else:
            print(f"Job {event.job_id} succeeded.")

    scheduler.add_listener(job_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
