import {supabase} from "./meta-supabase.js";

// One upsert per validated lesson/verse opening. Serialise writes for the same course:
// a slower request for an earlier verse must not overwrite a later position.
const pendingByCourse = new Map();

export function rememberCoursePosition(userId, courseSlug, lessonId) {
  if (!userId || !lessonId || !["flutter","ielts","quran"].includes(courseSlug)) return;
  const previous = pendingByCourse.get(courseSlug) || Promise.resolve();
  const pending = previous.catch(() => {}).then(async () => {
    const {error} = await supabase.from("course_resume_positions").upsert({
      user_id:userId, course_slug:courseSlug, lesson_id:lessonId,
      visited_at:new Date().toISOString()
    }, {onConflict:"user_id,course_slug"});
    if (error) console.warn("Meta resume position could not be saved:", error.message);
  });
  pendingByCourse.set(courseSlug,pending);
  void pending.finally(() => {
    if (pendingByCourse.get(courseSlug) === pending) pendingByCourse.delete(courseSlug);
  });
}
