#include "barrier.h"

// The random seed. Set for reproducibility
#define RAND_SEED 1

// The maximum amount of time worker threads are allowed to sleep for
#define WORKER_SLEEP_MAX 12

// The number of threads to run
#define NUM_THREADS 10

// The amount of time to lock the memory segment for
#define LOCK_FOR 2
#define UNLOCK_FOR 10

static volatile sig_atomic_t running = 1;
pthread_t thread[NUM_THREADS];

void* segment_start;
long segment_size;

struct barrier barrier;
pthread_t whitelist[2];

void my_segment_init()
{
    segment_size = sysconf(_SC_PAGE_SIZE);

    segment_start = mmap(NULL, 
            segment_size, 
            PROT_READ | PROT_WRITE,
            MAP_PRIVATE | MAP_ANONYMOUS,
            0, 0); 

    if(segment_start == MAP_FAILED) {
        barrier_error_en(errno, "mmap");
    }   

    printf("%x : initialized %ld bytes at %p\n", barrier_threadid(), segment_size, segment_start);
}


void my_barrier_init()
{
    // make this thread immune to the write barrier
    whitelist[0] = pthread_self();

    barrier.start = segment_start;
    barrier.size = segment_size;
    barrier.whitelist = whitelist;
    barrier.original_prot = PROT_READ | PROT_WRITE;

    barrier_init(&barrier);
}

void increment_counter()
{
    // the counter lives at the start of the lockable memory segment. 
    // ensure the compiler performs an atomic increment
    sig_atomic_t* counter = (sig_atomic_t*)segment_start;
    (*counter)++;

    printf("%x : incremented counter to %d\n", barrier_threadid(), *counter);
}

void peek_counter()
{
    sig_atomic_t* counter = (sig_atomic_t*)segment_start;
    printf("%x : it looks like the counter is %d\n", barrier_threadid(), *counter);

}

void rand_sleep()
{
    int sleep_for = random() % WORKER_SLEEP_MAX;
    //printf("%x : sleeping for %d\n", barrier_threadid(), sleep_for);
    sleep(sleep_for);
}

void* worker_main(void *arg)
{
    printf("%x : started\n", barrier_threadid());
    while(running) {
        rand_sleep();
        increment_counter();
    }
}

void create_workers()
{
    srandom(RAND_SEED);
    // create and start worker threads
    int i, code;
    for (i = 0; i < NUM_THREADS; i++) {
        code = pthread_create(&thread[i], NULL, &worker_main, NULL);
        if (code != 0)
            barrier_error_en(code, "pthread_create");
    }
}

void join_workers()
{
    int i, code;
    for (i = 0; i < NUM_THREADS; i++) {
        code = pthread_join(thread[i], NULL);
        if (code != 0)
            barrier_error_en(code, "pthread_join");
        printf("%x : waiting for %x\n", barrier_threadid(), (unsigned int)thread[i]);
    }
}

void main_loop()
{
    // lock and unlock the memory segment periodically
    while(running) {
        sleep(UNLOCK_FOR);
        barrier_activate(&barrier);
        sleep(LOCK_FOR);
        peek_counter();
        barrier_deactivate(&barrier);
    }
}

int main(int argc, char *argv[])
{
    my_segment_init();
    my_barrier_init();

    create_workers();
    main_loop();
    join_workers();

    barrier_destroy(&barrier);

    printf("%x : exiting", barrier_threadid());
    exit(EXIT_SUCCESS);
}

